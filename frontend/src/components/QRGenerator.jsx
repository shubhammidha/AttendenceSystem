import { useState } from "react";
import axios from "axios";

const QRGenerator = () => {
    const [qrImage, setQrImage] = useState("");
    const [qrString, setQrString] = useState("");
    const [classId, setClassId] = useState("69c188592fda59eb47432e5c");

    const generateQR = async () => {
        try{
            if (!classId.trim()) {
                alert("Please enter a class ID");
                return;
            }

            const res = await axios.post("http://localhost:5000/api/qr/generate", {
                classId: classId.trim()
            });

            setQrImage(res.data.qrImage);
            setQrString(res.data.qrString);
        } catch (error) {
            console.log("QR Generation Error:", error);
            alert("Failed to generate QR code");
        } 
    };

    return (
        <div>
            <h2>Generate QR</h2>
            <input
                type="text"
                placeholder="Enter Class ID"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                style={{
                    padding: "8px",
                    marginRight: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                }}
            />
            <button onClick={generateQR}>Generate QR</button>

            {qrImage && (
                <div style={{ marginTop: "20px" }}>
                    <img src={qrImage} alt="QR Code" style={{ maxWidth: "200px" }}/>
                    <div style={{ marginTop: "10px" }}>
                        <h4>QR Data (Copy this):</h4>
                        <textarea
                            value={qrString}
                            readOnly
                            style={{
                                width: "300px",
                                height: "80px",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                backgroundColor: "#f5f5f5"
                            }}
                        />
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(qrString);
                                alert("QR data copied to clipboard!");
                            }}
                            style={{
                                marginLeft: "10px",
                                padding: "8px 15px",
                                backgroundColor: "#22c55e",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
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