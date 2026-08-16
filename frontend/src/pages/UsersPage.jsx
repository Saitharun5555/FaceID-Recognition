import { useState, useEffect } from "react";
import axios from "axios";
import "./UsersPage.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await axios.get("/api/users/");
      setUsers(res.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId, name) {
    if (!confirm(`Remove ${name} from the system? This will also delete their face enrollment.`)) return;
    setDeleting(userId);
    try {
      await axios.delete(`/api/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Failed to delete user.");
    } finally {
      setDeleting(null);
    }
  }

  const initials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="page-title">Enrolled Users</h1>
          <p className="page-subtitle">All users registered in the face recognition system</p>
        </div>
        <div className="user-count-badge">{users.length} users</div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading users...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchUsers} className="btn-retry">Retry</button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No users enrolled yet</h3>
          <p>Go to the Register page to add the first user.</p>
          <a href="/register" className="btn-register-link">Register a User</a>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="users-grid">
          {users.map((user) => (
            <div key={user.id} className="user-tile">
              <div className="user-tile-header">
                <div className="tile-avatar">
                  {user.profile_image ? (
                    <img
                      src={`/uploads/profiles/${user.profile_image.split("/").pop()}`}
                      alt={user.full_name}
                    />
                  ) : (
                    <div className="tile-initials">{initials(user.full_name)}</div>
                  )}
                </div>
                <div className="tile-info">
                  <h3 className="tile-name">{user.full_name}</h3>
                  {user.occupation && (
                    <p className="tile-occupation">{user.occupation}</p>
                  )}
                </div>
              </div>

              <div className="tile-details">
                <div className="tile-detail">
                  <span className="tile-detail-icon">✉</span>
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="tile-detail">
                    <span className="tile-detail-icon">☎</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.age && (
                  <div className="tile-detail">
                    <span className="tile-detail-icon">◑</span>
                    <span>{user.age} years old</span>
                  </div>
                )}
              </div>

              {user.bio && <p className="tile-bio">{user.bio}</p>}

              <div className="tile-footer">
                <span className="tile-face-badge">
                  {user.face_encoding ? "✓ Face enrolled" : "✕ No face data"}
                </span>
                <button
                  className="tile-delete-btn"
                  onClick={() => handleDelete(user.id, user.full_name)}
                  disabled={deleting === user.id}
                >
                  {deleting === user.id ? "..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
