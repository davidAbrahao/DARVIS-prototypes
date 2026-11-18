import { useEffect, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudSun,
  Droplets,
  RefreshCw,
  Sun,
  Wind,
} from 'lucide-react';
import {
  fetchSimulatedPublicWeather,
  WEATHER_LOCATIONS,
  type WeatherCondition,
  type WeatherForecastData,
} from '../lib/weatherSimulation';
import { MaturityTag } from './MaturityTag';
import { Skeleton } from './Skeleton';

function WeatherConditionIcon({
  condition,
  className = 'w-5 h-5',
}: {
  condition: WeatherCondition;
  className?: string;
}) {
  if (condition === 'ensolarado') {
    return <Sun className={`${className} text-amber-400`} aria-hidden="true" />;
  }
  if (condition === 'parcialmente_nublado') {
    return <CloudSun className={`${className} text-cyan-400`} aria-hidden="true" />;
  }
  if (condition === 'chuva_leve') {
    return <CloudDrizzle className={`${className} text-sky-400`} aria-hidden="true" />;
  }
  return <Cloud className={`${className} text-slate-400`} aria-hidden="true" />;
}

interface WeatherWidgetProps {
  isLoading?: boolean;
}

export function WeatherWidget({ isLoading = false }: WeatherWidgetProps) {
  const [locationId, setLocationId] = useState('sao-paulo');
  const [weather, setWeather] = useState<WeatherForecastData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async (targetId: string) => {
    setFetching(true);
    setError(null);
    try {
      const data = await fetchSimulatedPublicWeather(targetId);
      setWeather(data);
    } catch {
      setError('Falha ao consultar a simulação meteorológica.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    let active = true;
    setFetching(true);
    fetchSimulatedPublicWeather(locationId)
      .then((data) => {
        if (active) {
          setWeather(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) {
          setError('Falha ao consultar a simulação meteorológica.');
        }
      })
      .finally(() => {
        if (active) {
          setFetching(false);
        }
      });
    return () => {
      active = false;
    };
  }, [locationId]);

  const showSkeleton = isLoading || (fetching && !weather);

  return (
    <section
      aria-label="Previsão do tempo"
      className="rounded-xl bg-surface border border-edge p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-display text-base font-semibold text-ink">
              Previsão do Tempo
            </h3>
            <MaturityTag
              maturity="simulated"
              labelOverride="Simulação API Pública"
            />
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            {weather?.providerLabel ?? 'Open-Meteo Public API (Simulado)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="weather-city-select" className="sr-only">
            Selecionar cidade para previsão
          </label>
          <select
            id="weather-city-select"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="bg-inset border border-edge-strong rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
          >
            {WEATHER_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadWeather(locationId)}
            disabled={fetching}
            aria-label="Atualizar previsão do tempo"
            className="p-2 rounded-lg border border-edge-strong text-ink-secondary hover:bg-hover-surface disabled:opacity-45 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {showSkeleton ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando previsão do tempo"
          data-testid="weather-skeleton"
          className="space-y-5"
        >
          <span className="sr-only">Carregando previsão do tempo...</span>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-edge">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <p role="alert" className="text-xs text-red-500 py-2">
          {error}
        </p>
      ) : weather ? (
        <div className="space-y-5">
          {/* Current Weather */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-inset border border-edge flex items-center justify-center shrink-0">
                <WeatherConditionIcon
                  condition={weather.condition}
                  className="w-6 h-6"
                />
              </div>
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-3xl font-semibold text-ink tabular-nums">
                    {weather.currentTemp}°C
                  </span>
                  <span className="text-sm text-ink-secondary">
                    {weather.conditionLabel}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                  {weather.locationName} · Sensação térmica {weather.feelsLike}°C
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs text-ink-muted tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-accent-text" aria-hidden="true" />
                <span>Umidade {weather.humidity}%</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                <span>Vento {weather.windKmh} km/h</span>
              </span>
            </div>
          </div>

          {/* 3-Day Outlook */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-edge">
            {weather.outlook.map((day) => (
              <div
                key={day.dateLabel}
                className="flex sm:flex-col items-center sm:items-start justify-between gap-2 py-1"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-ink">{day.weekday}</span>
                  <span className="font-mono text-ink-subtle tabular-nums">
                    {day.dateLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-ink-secondary">
                  <WeatherConditionIcon
                    condition={day.condition}
                    className="w-4 h-4 shrink-0"
                  />
                  <span>{day.conditionLabel}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                  <span className="text-ink">{day.tempMax}°</span>
                  <span className="text-ink-subtle">/</span>
                  <span className="text-ink-muted">{day.tempMin}°</span>
                  <span className="text-accent-text ml-1">· {day.precipChance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
