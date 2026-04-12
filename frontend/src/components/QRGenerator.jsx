import { useState } from "react";
import axios from "axios";

const QRGenerator = () => {
    const [qrImage, setQrImage] = useState("");
    const [qrString, setQrString] = useState("");
    const [classId, setClassId] = useState("69c188592fda59eb47432e5c");
    const [loading, setLoading] = useState(false);

    const generateQR = async () => {
        try{
            if (!classId.trim()) {
                alert("Please enter a class ID");
                return;
            }
            setLoading(true);
            const res = await axios.post("http://localhost:5000/api/qr/generate", {
                classId: classId.trim()
            });

            setQrImage(res.data.qrImage);
            setQrString(res.data.qrString);
        } catch (error) {
            console.log("QR Generation Error:", error);
            alert("Failed to generate QR code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Generate QR</h2>
            <input
                type="text"
                placeholder="Enter Class ID"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="form-input"
            />
            <button onClick={generateQR} className="btn-primary" disabled={loading}>
                {loading ? "Generating..." : "Generate QR"}
            </button>

            {qrImage && (
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                    <img src={qrImage} alt="QR Code" style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}/>
                    <div style={{ marginTop: "1rem" }}>
                        <h4 style={{ color: "#94a3b8" }}>QR Data (Copy this):</h4>
                        <textarea
                            value={qrString}
                            readOnly
                            className="form-input"
                            style={{ height: "80px", background: "#0f172a", color: "white" }}
                        />
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(qrString);
                                alert("QR data copied to clipboard!");
                            }}
                            className="btn-primary"
                            style={{ marginTop: "0.5rem" }}
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRGenerator;