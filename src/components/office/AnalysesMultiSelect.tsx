'use client';

import { useMemo } from 'react';
import Select, {
  type MultiValue,
  type StylesConfig,
  type Theme,
} from 'react-select';

export type AnalyseOptionSource = {
  id: string;
  name: string;
  code?: string | null;
};

type Option = { value: string; label: string };

const selectTheme = (theme: Theme) => ({
  ...theme,
  borderRadius: 8,
  colors: {
    ...theme.colors,
    primary: '#0d9488',
    primary25: '#f0fdfa',
    primary50: '#ccfbf1',
    primary75: '#99f6e4',
  },
});

const selectStyles: StylesConfig<Option, true> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: state.isFocused ? '#14b8a6' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(20, 184, 166, 0.2)' : 'none',
    backgroundColor: '#fff',
    '&:hover': { borderColor: '#14b8a6' },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#64748b',
    fontSize: '0.875rem',
  }),
  input: (base) => ({ ...base, fontSize: '0.875rem' }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    borderRadius: 6,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#0f766e',
    fontWeight: 600,
    fontSize: '0.8125rem',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#0f766e',
    borderRadius: 4,
    ':hover': {
      backgroundColor: 'rgba(13, 148, 136, 0.25)',
      color: '#115e59',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    boxShadow:
      '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
    zIndex: 30,
    overflow: 'hidden',
  }),
  menuList: (base) => ({ ...base, padding: 4, maxHeight: 280 }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    borderRadius: 6,
    margin: '2px 0',
    cursor: 'pointer',
    backgroundColor: state.isSelected
      ? '#0d9488'
      : state.isFocused
        ? '#f0fdfa'
        : 'transparent',
    color: state.isSelected ? '#fff' : '#0f172a',
    ':active': { backgroundColor: state.isSelected ? '#0d9488' : '#ccfbf1' },
  }),
};

type Props = {
  analyses: AnalyseOptionSource[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  inputId?: string;
};

export function AnalysesMultiSelect({
  analyses,
  value,
  onChange,
  disabled,
  inputId,
}: Props) {
  const options = useMemo<Option[]>(
    () =>
      analyses.map((a) => ({
        value: a.id,
        label: a.code ? `[${a.code}] ${a.name}` : a.name,
      })),
    [analyses],
  );

  const selected = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value],
  );

  return (
    <Select<Option, true>
      inputId={inputId}
      instanceId={inputId ?? 'analyses-multiselect'}
      isMulti
      isClearable
      isSearchable
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      options={options}
      value={selected}
      onChange={(next: MultiValue<Option>) => {
        onChange(next.map((o) => o.value));
      }}
      placeholder="Rechercher ou cliquer pour ajouter des analyses…"
      noOptionsMessage={() => 'Aucune analyse ne correspond'}
      loadingMessage={() => 'Chargement…'}
      isDisabled={disabled}
      theme={selectTheme}
      styles={selectStyles}
      classNames={{
        control: () => '!min-h-11',
      }}
    />
  );
}
