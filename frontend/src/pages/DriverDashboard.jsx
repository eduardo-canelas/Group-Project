import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DriverDashboard() {
    const [packages, setPackages] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchPackages = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/packages/packages');
            setPackages(response.data);
        } catch (err) {
            setError('could not fetch packages');
        };
    };
    useEffect(() => {
        fetchPackages();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/packages/packages/${id}`, {
                status: status
            });
            fetchPackages();
        } catch (err) {
            setError('could not update status');
        };
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <>
            <div className="driver-dashboard">
                <h1>Driver Dashboard - Packet Tracker</h1>
                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
            <div className="packages-list">
                <h2>Current Packages to Handle</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Description</th>
                            <th>Weight</th>
                            <th>Current Status</th>
                            <th>Update Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map((pkg) => (
                            <tr key={pkg._id}>
                                <td>{pkg._id}</td>
                                <td>{pkg.description}</td>
                                <td>{pkg.weight}</td>
                                <td>{pkg.status}</td>
                                <td>
                                    <select onChange={(e) => handleUpdateStatus(pkg._id, e.target.value)} value={pkg.status}>
                                        <option value="pending">Pending</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="picked-up">Picked Up</option>
                                        <option value="out-for-delivery">Out for Delivery</option>
                                        <option value="in-transit">In Transit</option>
                                        <option value="delivered">Delivered</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default DriverDashboard;


