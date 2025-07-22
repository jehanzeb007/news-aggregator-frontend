import React, { useState, useEffect } from "react";
import api from "./services/api";

interface User {
  id: string;
  name: string;
  email: string;
  profile_pic?: string;
  profile_pic_url?: string;
}

interface Preferences {
  use_newsapi: boolean;
  use_gnews: boolean;
  use_mediastack: boolean;
}

const Preferences: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    old_password: string;
    new_password: string;
    confirm_password: string;
    profile_pic: string | File;
  }>({
    name: "",
    email: "",
    old_password: "",
    new_password: "",
    confirm_password: "",
    profile_pic: "",
  });
  const [prefs, setPrefs] = useState<Preferences>({
    use_newsapi: true,
    use_gnews: true,
    use_mediastack: true,
  });
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    api.get("/user").then((res) => {
      setUser(res.data);
      setForm({
        name: res.data.name,
        email: res.data.email,
        old_password: "",
        new_password: "",
        confirm_password: "",
        profile_pic: res.data.profile_pic || "",
      });
      api.get("/preferences", { params: { user_id: res.data.id } }).then((res) => {
              setPrefs(res.data);
            });
    });
  }, []);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, profile_pic: file });
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setFormErrors({}); // Clear previous errors

    // Password validation (frontend)
    if (
      (form.old_password || form.new_password || form.confirm_password) &&
      (!form.old_password ||
        !form.new_password ||
        !form.confirm_password ||
        form.new_password !== form.confirm_password)
    ) {
      setFormErrors({
        new_password:
          form.new_password !== form.confirm_password
            ? ["New password and confirm password do not match."]
            : ["Please fill all password fields."],
      });
      return;
    }

    try {
      // Save user details
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);

      // Only send password fields if filled
      if (form.old_password && form.new_password && form.confirm_password) {
        formData.append("old_password", form.old_password);
        formData.append("new_password", form.new_password);
        formData.append("new_password_confirmation", form.confirm_password); // Laravel expects this name!
      }

      if (form.profile_pic && form.profile_pic instanceof File) {
        formData.append("profile_pic", form.profile_pic);
      }

      const userRes = await api.post("/user/update", formData);
      setUser(userRes.data);

      // Save preferences
      await api.post("/preferences", prefs);

      setPopupMessage("Preferences saved!");
      setShowPopup(true);
    } catch (err: any) {
      // Show backend validation errors
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.errors) {
          setFormErrors(data.errors);
        } else if (data.message) {
          setFormErrors({ general: [data.message] });
        } else {
          setFormErrors({
            general: ["An error occurred. Please check your input."],
          });
        }
      } else {
        setFormErrors({ general: ["An error occurred. Please try again."] });
      }
    }
  };

  // Helper for initials
  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";

  return (
    <div className="preferences-page">
      <h2>Preferences</h2>
      {/* Profile Picture Section */}
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          {profilePreview || user?.profile_pic_url ? (
            <img
              src={profilePreview || user?.profile_pic_url}
              alt="Profile"
              className="avatar-img"
            />
          ) : (
            <div className="avatar-placeholder">
              {getInitials(form.name || user?.name || "")}
            </div>
          )}
          <label className="avatar-upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              style={{ display: "none" }}
            />
            <span className="avatar-edit-icon">&#9998;</span>
          </label>
        </div>
        <div className="avatar-info">
          <div className="avatar-label">Profile Picture</div>
          <div className="avatar-desc">PNG, JPEG Max size of 2MB</div>
        </div>
      </div>

      <div className="profile-section">
        <label>Name</label>
        <input
          className="form-input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {formErrors.name && (
          <div className="form-error">{formErrors.name[0]}</div>
        )}

        <label>Email</label>
        <input
          className="form-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {formErrors.email && (
          <div className="form-error">{formErrors.email[0]}</div>
        )}

        <h3 className="chnge-pass">Change Password</h3>
        <label>Old Password</label>
        <input
          className="form-input"
          type="password"
          value={form.old_password}
          onChange={(e) => setForm({ ...form, old_password: e.target.value })}
        />
        {formErrors.old_password && (
          <div className="form-error">{formErrors.old_password[0]}</div>
        )}

        <label>New Password</label>
        <input
          className="form-input"
          type="password"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
        />
        {formErrors.new_password && (
          <div className="form-error">{formErrors.new_password[0]}</div>
        )}

        <label>Confirm Password</label>
        <input
          className="form-input"
          type="password"
          value={form.confirm_password}
          onChange={(e) =>
            setForm({ ...form, confirm_password: e.target.value })
          }
        />
        {formErrors.confirm_password && (
          <div className="form-error">{formErrors.confirm_password[0]}</div>
        )}

        {formErrors.profile_pic && (
          <div className="form-error">{formErrors.profile_pic[0]}</div>
        )}
      </div>
      <div className="api-preferences">
        <h3>News Sources</h3>
        <label>
          <input
            type="checkbox"
            checked={prefs.use_newsapi}
            onChange={(e) =>
              setPrefs({ ...prefs, use_newsapi: e.target.checked })
            }
          />
          NewsAPI
        </label>
        <label>
          <input
            type="checkbox"
            checked={prefs.use_gnews}
            onChange={(e) =>
              setPrefs({ ...prefs, use_gnews: e.target.checked })
            }
          />
          GNews
        </label>
        <label>
          <input
            type="checkbox"
            checked={prefs.use_mediastack}
            onChange={(e) =>
              setPrefs({ ...prefs, use_mediastack: e.target.checked })
            }
          />
          MediaStack
        </label>
      </div>
      {formErrors.general && (
        <div className="form-error">{formErrors.general[0]}</div>
      )}
      <button onClick={handleSave}>Save Preferences</button>

      {/* Custom Popup */}
      {showPopup && (
        <div className="custom-popup-overlay">
          <div className="custom-popup fancy">
            <div className="popup-icon">&#10003;</div>
            <h3 className="popup-title">Success!</h3>
            <p className="popup-message">{popupMessage}</p>
            <button className="popup-btn" onClick={() => setShowPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preferences;