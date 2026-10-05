import logo from '../assets/regalis-logo.png';

export default function PortalHeader({ user, onLogout }) {
  return (
    <header>
      <div className="brand-container">
        <img src={logo} alt="" width="250" height="226" />
        <div className="header-text">
          <div className="brand-title">REGALIS CAPITAL</div>
          <div className="eyebrow under-title">Integrated Client Portal</div>
          <h1>Schedule &amp; Set Availability Matrix</h1>
          <p>Select time slots on the matrix or fill out client details to confirm an appointment.</p>
        </div>
        {/*
          The original page never closed .brand-container before </header>, so the browser rendered the
          badge inside it, right beside the title. Kept that way to preserve the look; move this block
          outside .brand-container to push it to the far right edge instead.
        */}
        <div className="user-badge">
          <div className="user-badge-info">
            <div className="user-badge-name">{user.name}</div>
            <div className="user-badge-email">{user.email}</div>
          </div>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
