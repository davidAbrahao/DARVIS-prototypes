export type WeatherCondition =
  | 'ensolarado'
  | 'parcialmente_nublado'
  | 'nublado'
  | 'chuva_leve';

export interface WeatherDayOutlook {
  dateLabel: string;
  weekday: string;
  condition: WeatherCondition;
  conditionLabel: string;
  tempMin: number;
  tempMax: number;
  precipChance: number;
}

export interface WeatherForecastData {
  locationId: string;
  locationName: string;
  providerLabel: string;
  currentTemp: number;
  feelsLike: number;
  humidity: number;
  windKmh: number;
  condition: WeatherCondition;
  conditionLabel: string;
  updatedAt: string;
  outlook: WeatherDayOutlook[];
  isSimulated: true;
}

export interface WeatherLocationOption {
  id: string;
  label: string;
}

export const WEATHER_LOCATIONS: WeatherLocationOption[] = [
  { id: 'sao-paulo', label: 'São Paulo, SP' },
  { id: 'rio-de-janeiro', label: 'Rio de Janeiro, RJ' },
  { id: 'belo-horizonte', label: 'Belo Horizonte, MG' },
  { id: 'curitiba', label: 'Curitiba, PR' },
  { id: 'brasilia', label: 'Brasília, DF' },
];

const CONDITION_LABELS: Record<WeatherCondition, string> = {
  ensolarado: 'Céu limpo',
  parcialmente_nublado: 'Parcialmente nublado',
  nublado: 'Nublado',
  chuva_leve: 'Chuva leve',
};

interface CityWeatherPreset {
  locationName: string;
  currentTemp: number;
  feelsLike: number;
  humidity: number;
  windKmh: number;
  condition: WeatherCondition;
  days: Array<{
    condition: WeatherCondition;
    tempMin: number;
    tempMax: number;
    precipChance: number;
  }>;
}

const CITY_PRESETS: Record<string, CityWeatherPreset> = {
  'sao-paulo': {
    locationName: 'São Paulo, SP',
    currentTemp: 23,
    feelsLike: 24,
    humidity: 64,
    windKmh: 14,
    condition: 'parcialmente_nublado',
    days: [
      { condition: 'ensolarado', tempMin: 17, tempMax: 26, precipChance: 10 },
      { condition: 'chuva_leve', tempMin: 16, tempMax: 22, precipChance: 65 },
      { condition: 'parcialmente_nublado', tempMin: 17, tempMax: 24, precipChance: 25 },
    ],
  },
  'rio-de-janeiro': {
    locationName: 'Rio de Janeiro, RJ',
    currentTemp: 28,
    feelsLike: 30,
    humidity: 68,
    windKmh: 18,
    condition: 'ensolarado',
    days: [
      { condition: 'ensolarado', tempMin: 22, tempMax: 31, precipChance: 10 },
      { condition: 'parcialmente_nublado', tempMin: 21, tempMax: 29, precipChance: 20 },
      { condition: 'chuva_leve', tempMin: 20, tempMax: 26, precipChance: 55 },
    ],
  },
  'belo-horizonte': {
    locationName: 'Belo Horizonte, MG',
    currentTemp: 25,
    feelsLike: 25,
    humidity: 58,
    windKmh: 12,
    condition: 'parcialmente_nublado',
    days: [
      { condition: 'parcialmente_nublado', tempMin: 18, tempMax: 27, precipChance: 20 },
      { condition: 'ensolarado', tempMin: 17, tempMax: 28, precipChance: 10 },
      { condition: 'nublado', tempMin: 18, tempMax: 25, precipChance: 35 },
    ],
  },
  curitiba: {
    locationName: 'Curitiba, PR',
    currentTemp: 18,
    feelsLike: 17,
    humidity: 76,
    windKmh: 16,
    condition: 'nublado',
    days: [
      { condition: 'chuva_leve', tempMin: 13, tempMax: 19, precipChance: 70 },
      { condition: 'nublado', tempMin: 12, tempMax: 20, precipChance: 35 },
      { condition: 'ensolarado', tempMin: 13, tempMax: 22, precipChance: 10 },
    ],
  },
  brasilia: {
    locationName: 'Brasília, DF',
    currentTemp: 26,
    feelsLike: 26,
    humidity: 48,
    windKmh: 15,
    condition: 'ensolarado',
    days: [
      { condition: 'ensolarado', tempMin: 18, tempMax: 28, precipChance: 5 },
      { condition: 'parcialmente_nublado', tempMin: 18, tempMax: 27, precipChance: 15 },
      { condition: 'chuva_leve', tempMin: 17, tempMax: 24, precipChance: 50 },
    ],
  },
};

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getSimulatedWeatherForLocation(
  locationId: string,
  referenceDate: Date = new Date()
): WeatherForecastData {
  const safeId = CITY_PRESETS[locationId] ? locationId : 'sao-paulo';
  const preset = CITY_PRESETS[safeId];

  const outlook: WeatherDayOutlook[] = preset.days.map((day, index) => {
    const targetDate = new Date(referenceDate);
    targetDate.setDate(referenceDate.getDate() + index + 1);
    const dayNum = String(targetDate.getDate()).padStart(2, '0');
    const monthNum = String(targetDate.getMonth() + 1).padStart(2, '0');
    return {
      dateLabel: `${dayNum}/${monthNum}`,
      weekday: index === 0 ? 'Amanhã' : WEEKDAYS_PT[targetDate.getDay()],
      condition: day.condition,
      conditionLabel: CONDITION_LABELS[day.condition],
      tempMin: day.tempMin,
      tempMax: day.tempMax,
      precipChance: day.precipChance,
    };
  });

  return {
    locationId: safeId,
    locationName: preset.locationName,
    providerLabel: 'Open-Meteo Public API (Simulado)',
    currentTemp: preset.currentTemp,
    feelsLike: preset.feelsLike,
    humidity: preset.humidity,
    windKmh: preset.windKmh,
    condition: preset.condition,
    conditionLabel: CONDITION_LABELS[preset.condition],
    updatedAt: referenceDate.toISOString(),
    outlook,
    isSimulated: true,
  };
}

export async function fetchSimulatedPublicWeather(
  locationId: string
): Promise<WeatherForecastData> {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return getSimulatedWeatherForLocation(locationId, new Date());
}
