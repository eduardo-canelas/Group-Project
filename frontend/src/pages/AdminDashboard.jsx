import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [packages, setPackages] = useState([]);
    const [description, setDescription] = useState('');
    const [weight, setWeight] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchPackages = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/packages/packages');
            setPackages(response.data);


        } catch (err) {
            setError('could not fetch packages');
        };
    }
    useEffect(() => {
        fetchPackages();
    }, []);

    const handleAddPackage = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/packages/packages', {
                description,
                weight
            });
            setDescription('');
            setWeight('');
            fetchPackages();
        } catch (err) {
            setError('could not add package');
        };
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(
                `http://localhost:5000/api/packages/packages/${id}`
            );
            fetchPackages();
        } catch (err) {
            setError('could not delete package');
        };
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <>
            <div className="admin-dashboard">
                <h1>Admin Dashboard - Packet Tracker Control</h1>
                <button onClick={handleLogout} style={{
                    padding: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                }}>Logout</button>
            </div>
            <div className="add-package-container">
                <h2>Create New Package</h2>
                <form onSubmit={handleAddPackage}>
                    <div className="form-group-description">
                        <label>Description:</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div className="form-group-weight">
                        <label>Weight:</label>
                        <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} required />
                    </div>
                    <button type="submit">Add Package</button>
                </form>
            </div>
            <div className="packages-list">
                <h2>Current Packages</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map((pkg) => (
                            <tr key={pkg._id}>
                                <td>{pkg._id}</td>
                                <td>{pkg.description}</td>
                                <td>{pkg.status}</td>
                                <td>
                                    <button onClick={() => handleDelete(pkg._id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AdminDashboard;
