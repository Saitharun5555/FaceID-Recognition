import "./UserCard.css";

export default function UserCard({ user }) {
  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="avatar-wrap">
          {user.profile_image ? (
            <img
              src={`/uploads/profiles/${user.profile_image.split("/").pop()}`}
              alt={user.full_name}
              className="avatar-img"
            />
          ) : (
            <div className="avatar-initials">{initials}</div>
          )}
          <div className="avatar-verified">✓</div>
        </div>
        <div>
          <h2 className="user-name">{user.full_name}</h2>
          {user.occupation && (
            <p className="user-occupation">{user.occupation}</p>
          )}
        </div>
      </div>

      <div className="user-details">
        <DetailRow icon="✉" label="Email" value={user.email} />
        {user.phone && <DetailRow icon="☎" label="Phone" value={user.phone} />}
        {user.age && <DetailRow icon="◑" label="Age" value={`${user.age} years`} />}
        {joinDate && <DetailRow icon="◷" label="Registered" value={joinDate} />}
      </div>

      {user.bio && (
        <div className="user-bio">
          <p className="bio-label">About</p>
          <p className="bio-text">{user.bio}</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-icon">{icon}</span>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}
