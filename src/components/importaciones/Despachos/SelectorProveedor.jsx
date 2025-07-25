import React, { useEffect, useState } from 'react';
import { AutoComplete } from 'antd';
import { buscarProveedor } from '../../../api/Despachos';

export default function SelectorProveedor({ value, onChange, disabled = false }) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (typeof value === 'object' && value?.nombre_proveedor) {
      setInputValue(value.nombre_proveedor);
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
      const res = await buscarProveedor(searchText);
      const opts = res.map((p) => ({
        label: p.nombre_proveedor,
        value:  `id-${p.id}`,
        proveedor: p,
      }));
      setOptions(opts);
    } catch (err) {
      console.error('Error al buscar proveedores:', err);
    }
  };

  const handleSelect = (text, option) => {
    setInputValue(text);
    if (option.proveedor) {
      onChange(option.proveedor);
    }
  };

  const handleChange = (text) => {
    setInputValue(text);
    onChange({ nombre_proveedor: text, isNuevo: true });
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
