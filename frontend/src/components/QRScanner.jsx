import { useState } from "react";
import axios from "axios";

const QRScanner = ({ classId: propClassId, lectureId: propLectureId }) => {
    const [qrText, setQrText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleScan = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("User not logged in. Please login again.");
            return;
        }

        setLoading(true);
        
        try{
            let finalClassId = propClassId;
            let finalLectureId = propLectureId;

            // If text is provided, try to parse it (fallback for manual entry)
            if (qrText.trim()) {
                try {
                    const parsedData = JSON.parse(qrText);
                    finalClassId = parsedData.classId || finalClassId;
                    finalLectureId = parsedData.lectureId || finalLectureId;
                } catch {
                    // Not JSON, assume it's just a classId
                    finalClassId = qrText.trim() || finalClassId;
                }
            }

            if (!finalClassId) {
                throw new Error("Missing class ID for attendance");
            }
            
            const res = await axios.post("http://localhost:5000/api/qr/scan", {
                classId: finalClassId,
                lectureId: finalLectureId,
                studentId: userId
            });

            alert(res.data.message || "Attendance marked successfully");
            setQrText(""); // Clear input after successful scan
            
            // Refresh dashboard
            window.dispatchEvent(new CustomEvent('attendanceMarked', { 
                detail: { message: 'Attendance marked successfully' }
            }));
            
        } catch (error) {
            console.log("QR Scan Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Invalid QR or failed to mark attendance";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
    <div style={{ marginTop: "30px" }}>
      <h2>Scan QR</h2>

      <textarea
        placeholder="Paste QR data here (JSON format or class ID)"
        value={qrText}
        onChange={(e) => setQrText(e.target.value)}
        style={{
          width: "300px",
          height: "100px",
          marginTop: "10px",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc"
        }}
      />

      <br />

      <button 
        onClick={handleScan} 
        disabled={loading}
        style={{ 
          marginTop: "10px",
          padding: "10px 20px",
          backgroundColor: loading ? "#ccc" : "#22c55e",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Processing..." : "Mark Attendance"}
      </button>
    </div>
  );
    
}

export default QRScanner;