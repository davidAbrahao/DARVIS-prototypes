import hashlib

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1._common import like_pattern, owned_or_404, patch_data
from app.db.session import get_db
from app.models.knowledge import Note, NoteTag
from app.models.user import User
from app.schemas.knowledge import Category, NoteCreate, NoteOut, NoteUpdate
from app.services.audit import record

router = APIRouter(prefix="/notes", tags=["notes"])


def _hash(title: str, body: str) -> str:
    return hashlib.sha256(f"{title}\n{body}".encode()).hexdigest()


def _set_tags(note: Note, tags: list[str]) -> None:
    keep = set(tags)
    note.tag_rows = [r for r in note.tag_rows if r.tag in keep]
    have = {r.tag for r in note.tag_rows}
    note.tag_rows.extend(NoteTag(tag=t) for t in tags if t not in have)


@router.get("", response_model=list[NoteOut])
def list_notes(
    q: str | None = None,
    category: Category | None = None,
    tag: str | None = None,
    pinned: bool | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Note).where(Note.user_id == user.id)
    if q and q.strip():
        like = like_pattern(q)
        stmt = stmt.where(or_(Note.title.ilike(like, escape="\\"), Note.body.ilike(like, escape="\\")))
    if category:
        stmt = stmt.where(Note.category == category)
    if tag:
        stmt = stmt.where(Note.id.in_(select(NoteTag.note_id).where(NoteTag.tag == tag.strip().lower().lstrip("#"))))
    if pinned is not None:
        stmt = stmt.where(Note.pinned.is_(pinned))
    stmt = stmt.order_by(Note.pinned.desc(), Note.updated_at.desc(), Note.id.desc()).limit(limit).offset(offset)
    return db.scalars(stmt).all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(body: NoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = Note(
        user_id=user.id, title=body.title, body=body.body, category=body.category,
        pinned=body.pinned, content_hash=_hash(body.title, body.body),
    )
    _set_tags(note, body.tags)
    db.add(note)
    db.flush()
    record(db, "note_created", user_id=user.id, detail=str(note.id))
    db.commit()
    return note


@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return owned_or_404(db, Note, note_id, user)


@router.get("/{note_id}/related", response_model=list[NoteOut])
def related_notes(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Notas que compartilham tags com esta, as mais parecidas primeiro."""
    note = owned_or_404(db, Note, note_id, user)
    mine = [r.tag for r in note.tag_rows]
    if not mine:
        return []
    ranked = db.execute(
        select(NoteTag.note_id, func.count().label("n"))
        .where(NoteTag.tag.in_(mine), NoteTag.note_id != note.id)
        .group_by(NoteTag.note_id)
        .order_by(desc("n"), NoteTag.note_id)
        .limit(10)
    ).all()
    order = [r[0] for r in ranked]
    found = {n.id: n for n in db.scalars(select(Note).where(Note.id.in_(order), Note.user_id == user.id))}
    return [found[i] for i in order if i in found]


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, body: NoteUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = owned_or_404(db, Note, note_id, user)
    data = patch_data(body)
    tags = data.pop("tags", None)
    for k, v in data.items():
        setattr(note, k, v)
    if tags is not None:
        _set_tags(note, tags)
    if "title" in data or "body" in data:
        note.content_hash = _hash(note.title, note.body)
    db.commit()
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = owned_or_404(db, Note, note_id, user)
    db.delete(note)
    record(db, "note_deleted", user_id=user.id, detail=str(note_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
