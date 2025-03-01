import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [newAuction, setNewAuction] = useState({ itemName: '', startingBid: '' });
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      nav('/signin'); // Redirect to signin if not authenticated
      return;
    }
    fetchItems();
  }, []);

  // 🔹 Fetch Auctions
  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5001/auctions');
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  // 🔹 Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    nav('/signin');
  };

  // 🔹 Handle Auction Post
  const handlePostAuction = async (e) => {
    e.preventDefault();
    if (!newAuction.itemName || !newAuction.startingBid) {
      alert('Please enter item name and starting bid!');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5001/auctions', newAuction);
      setItems([...items, res.data]); // Update UI instantly
      setNewAuction({ itemName: '', startingBid: '' }); // Reset form
    } catch (error) {
      console.error('Error posting auction:', error);
    }
  };

  // 🔹 Handle Delete Auction
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/auctions/${id}`);
      setItems(items.filter((item) => item._id !== id)); // Remove from UI
    } catch (error) {
      console.error('Error deleting auction:', error);
    }
  };

  // 🔹 Handle Edit Auction (Redirect to Edit Page)
  const handleEdit = (id) => {
    nav(`/edit-auction/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 🔹 Navbar */}
      <div className="flex justify-between items-center bg-blue-600 p-4 text-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold">Auction Dashboard</h2>
        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600">
          Logout
        </button>
      </div>

      {/* 🔹 Add Auction Form */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Post a New Auction</h3>
        <form onSubmit={handlePostAuction} className="flex gap-3">
          <input
            type="text"
            placeholder="Item Name"
            value={newAuction.itemName}
            onChange={(e) => setNewAuction({ ...newAuction, itemName: e.target.value })}
            className="border p-2 rounded-lg w-1/3"
            required
          />
          <input
            type="number"
            placeholder="Starting Bid ($)"
            value={newAuction.startingBid}
            onChange={(e) => setNewAuction({ ...newAuction, startingBid: e.target.value })}
            className="border p-2 rounded-lg w-1/3"
            required
          />
          <button type="submit" className="bg-green-500 px-4 py-2 rounded-lg text-white hover:bg-green-600">
            Post Auction
          </button>
        </form>
      </div>

      {/* 🔹 Auction List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item._id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-lg font-semibold">{item.itemName}</h3>
              <p className="text-gray-600">
                Current Bid: <strong>${item.currentBid || item.startingBid}</strong>
              </p>
              <p className={`text-sm ${item.isClosed ? 'text-red-500' : 'text-green-500'}`}>
                {item.isClosed ? 'Closed' : 'Active'}
              </p>

              {/* 🔹 Buttons */}
              <div className="flex gap-2 mt-3">
                <Link to={`/auction/${item._id}`}>
                  <button className="bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600">
                    View
                  </button>
                </Link>
                <button
                  onClick={() => handleEdit(item._id)}
                  className="bg-yellow-500 text-white py-1 px-3 rounded-lg hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-center col-span-full">No auctions available</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
