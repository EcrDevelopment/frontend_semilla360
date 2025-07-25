import React, { useEffect, useState } from 'react';
import { AutoComplete } from 'antd';
import { buscarTransportista } from '../../../api/Despachos';

export default function SelectorTransportista({ value, onChange, disabled = false }) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (typeof value === 'object' && value?.nombre_transportista) {
      setInputValue(value.nombre_transportista);
    } else if (typeof value === 'string') {
      setInputValue(value);
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleSearch = async (searchText) => {
    setInputValue(searchText);
    if (!searchText) {
      setOptions([]);
      return;
    }

    try {
      const res = await buscarTransportista(searchText);
      const opts = res.map((t) => ({
        label: t.nombre_transportista,
        value:  `id-${t.id}`,
        transportista: t,
      }));
      setOptions(opts);
    } catch (err) {
      console.error('Error al buscar transportistas:', err);
    }
  };

  const handleSelect = (text, option) => {
    setInputValue(text);
    if (option.transportista) {
      onChange(option.transportista);
    }
  };

  const handleChange = (text) => {
    setInputValue(text);
    onChange({ nombre_transportista: text, isNuevo: true });
  };

  return (
    <AutoComplete
      style={{ width: '100%' }}
      disabled={disabled}
      options={options}
      value={inputValue}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={handleChange}
      placeholder="Escribe o selecciona"
      filterOption={false}
    />
  );
}
