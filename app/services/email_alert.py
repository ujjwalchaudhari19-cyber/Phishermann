import resend
import os
from datetime import datetime

resend.api_key = os.environ.get("RESEND_API_KEY")

def send_phishing_alert(user_email: str, url: str, 
                        confidence_score: float, 
                        verdict: str):
    try:
        params = {
            # Local Testing / Sandbox Mode
            "from": "Phishermann <onboarding@resend.dev>",
            "to": [user_email],
            "subject": "⚠️ Warning: Phishing Site Detected",
            "html": f"""
            <div style="font-family: sans-serif;
            max-width: 600px; margin: 0 auto;
            background: #07070f; color: #e8e8f0;
            padding: 2rem; border-radius: 12px;">
            
              <h2 style="color: #ff2244;">
                ⚠️ Phishing Site Detected
              </h2>
              
              <p>Our Chrome extension detected that 
              you visited or clicked a link to a 
              phishing or suspicious site.</p>
              
              <div style="background: #0d0d1a;
              padding: 1rem; border-radius: 8px;
              border-left: 3px solid #ff2244;
              margin: 1rem 0;">
                <p><strong>Blocked URL:</strong> 
                {url}</p>
                <p><strong>Confidence Score:</strong> 
                {confidence_score}%</p>
                <p><strong>Verdict:</strong> 
                {verdict.upper()}</p>
                <p><strong>Time:</strong> 
                {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
              </div>
              
              <h3 style="color: #0066ff;">
                Immediate steps to take:
              </h3>
              <ol style="color: #e8e8f0; 
              line-height: 1.8;">
                <li>Do not enter any credentials 
                on that site</li>
                <li>Clear your browser cache 
                immediately</li>
                <li>Run a malware scan on your 
                device</li>
                <li>If you entered any passwords, 
                change them immediately</li>
              </ol>
              
              <p style="color: #555570; 
              font-size: 13px; margin-top: 2rem;">
                Stay safe,<br/>
                PhisherMann Security Team
              </p>
            </div>
            """
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"Email alert failed: {e}")
