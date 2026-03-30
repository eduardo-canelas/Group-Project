import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('driver');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                username,
                password,
                role
            });
            alert('Registration successful');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again');
        };
    };

    return (
        <div className="register-container">
            <h2>Register - Packet Tracker</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleRegister}>
                <div className="form-group-username">
                    <label>Username:</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px'
                    }} />
                </div>
                <div className="form-group-password">
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px'
                    }} />
                </div>
                <div className="form-group-role">
                    <label>Role:</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px'
                    }}>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                }}>Register</button>
            </form>
            <p>Already have an account? <Link to="/">Login here</Link></p>
        </div>
    );
};

export default Register;
