import { useState } from "react";
import axios from "axios";

const QRGenerator = () => {
    const [qrImage, setQrImage] = useState("");

    const generateQR = async () => {
        try{
            const res = await axios.post("http://localhost:5000/api/qr/generate", {
                classId: "69c188592fda59eb47432e5c"
            });

            setQrImage(res.data.qrImage);
        } catch (error) {
            console.log(error);
        } 
    };

    return (
        <div>
            <h2>Generate QR</h2>
            <button onClick={generateQR}>Generate QR</button>

            {qrImage && <img src={qrImage} alt="QR Code"/>}
        </div>
    );
};

export default QRGenerator;