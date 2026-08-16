import { useState, useCallback } from "react";
import axios from "axios";
import Camera from "../components/Camera";
import "./RegisterPage.css";

const INITIAL_FORM = {
  full_name: "",
  email: "",
  phone: "",
  age: "",
  occupation: "",
  bio: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [capturedImage, setCapturedImage] = useState(null);
  const [embedding, setEmbedding] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleCapture = useCallback((dataUrl) => {
    setCapturedImage(dataUrl);
    setError(null);
  }, []);

  const handleEmbedding = useCallback((emb) => {
    setEmbedding(emb);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const errors = {};
    if (!form.full_name.trim()) errors.full_name = "Name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Invalid email";
    if (!embedding) errors.face = "Please capture your face photo";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      formData.append("face_embedding", JSON.stringify(embedding));
      if (profilePhoto) formData.append("profile_photo", profilePhoto);

      const res = await axios.post("/api/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(res.data);
      setForm(INITIAL_FORM);
      setCapturedImage(null);
      setEmbedding(null);
      setProfilePhoto(null);
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="page-header">
        <h1 className="page-title">Register</h1>
        <p className="page-subtitle">
          Create your profile and enroll your face for identification
        </p>
      </div>

      {success && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          <div>
            <strong>Registration Successful!</strong>
            <p>
              Welcome, {success.user?.full_name}! Your face has been enrolled
              and you can now be identified.
            </p>
          </div>
        </div>
      )}

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Left — Profile details */}
          <div className="form-section card">
            <h2 className="section-title">Personal Details</h2>

            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className={fieldErrors.full_name ? "input-error" : ""}
              />
              {fieldErrors.full_name && (
                <span className="field-error">{fieldErrors.full_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={fieldErrors.email ? "input-error" : ""}
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input
                id="occupation"
                name="occupation"
                type="text"
                value={form.occupation}
                onChange={handleChange}
                placeholder="Software Engineer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile_photo">Profile Photo (optional)</label>
              <input
                id="profile_photo"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePhoto(e.target.files[0])}
                className="file-input"
              />
            </div>
          </div>

          {/* Right — Face capture */}
          <div className="form-section card">
            <h2 className="section-title">Face Enrollment *</h2>
            <p className="section-desc">
              Position your face within the oval guide and capture a clear
              photo. Ensure good lighting.
            </p>

            <Camera
              onCapture={handleCapture}
              onEmbedding={handleEmbedding}
              captureLabel="Capture Face"
            />

            {fieldErrors.face && (
              <span className="field-error center">{fieldErrors.face}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">✕</span>
            <p>{error}</p>
          </div>
        )}

        <div className="submit-row">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner" />
                Registering...
              </>
            ) : (
              "✓ Complete Registration"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
