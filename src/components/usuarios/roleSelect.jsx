import React from "react";
import { Form, Select } from "antd";

const { Option } = Select;

const RoleSelect = ({ roles, onChange, value }) => {
    return (
        <Form.Item name="roles" label="Roles" rules={[{ required: true }]}>
            <Select
                mode="multiple"
                placeholder="Selecciona uno o más roles"
                onChange={onChange}
                value={value}
            >
                {roles.map((role) => (
                    <Option key={role.id} value={role.id}>
                        {role.name}
                    </Option>
                ))}
            </Select>
        </Form.Item>
    );
};

export default RoleSelect;