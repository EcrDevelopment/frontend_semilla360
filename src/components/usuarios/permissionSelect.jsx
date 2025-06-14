import React from 'react';
import { Form, Select } from 'antd';

const PermissionsSelect = ({ permissions }) => (
    <Form.Item name="permissions" label="Permisos">
        <Select mode="multiple" placeholder="Selecciona permisos">
            {permissions.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.codename}</Select.Option>
            ))}
        </Select>
    </Form.Item>
);

export default PermissionsSelect;
