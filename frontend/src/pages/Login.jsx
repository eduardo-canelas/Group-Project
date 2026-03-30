import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password
            });

            localStorage.setItem('user', JSON.stringify(response.data));
            if (response.data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/driver');
            }
        } catch (err) {

            setError(err.response?.data?.message || 'login failed. Please check credentials');
        }
    };

    return (
        <div className="login-container">
            <h2>Login - Packet Tracker</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
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
                    <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px'
                    }} />
                </div>
                <button type="submit" style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                }}>Login</button>
            </form>
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
    );
}

export default Login;
