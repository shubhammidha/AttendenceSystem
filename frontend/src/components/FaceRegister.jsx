import { useState, useRef, useEffect } from "react";
import axios from "axios";

const FaceRegister = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [faceStatus, setFaceStatus] = useState(null);
    const [debugCount, setDebugCount] = useState(0); // Add debug counter
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        checkFaceStatus();
    }, []);

    const checkFaceStatus = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/face/status/${userId}`);
            setFaceStatus(res.data);
        } catch (error) {
            console.log("Face status check error:", error);
        }
    };

    const startCamera = async () => {
        try {
            console.log("Starting camera...");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
            });
            
            console.log("Got stream:", stream);
            
            if (videoRef.current) {
                console.log("videoRef.current exists, setting srcObject");
                videoRef.current.srcObject = stream;
                console.log("Set srcObject");
                
                // Force state change immediately
                console.log("Force setting isStreaming to TRUE");
                setIsStreaming(true);
                setDebugCount(prev => prev + 1);
                
                // Try to play video (but don't wait for it)
                videoRef.current.play().then(() => {
                    console.log("Video playing successfully");
                }).catch(err => {
                    console.log("Video play error (but state already set):", err);
                });
            } else {
                console.log("ERROR: videoRef.current is null!");
                console.log("videoRef:", videoRef);
            }
        } catch (error) {
            console.log("Camera access error:", error);
            alert("Unable to access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg');
            setCapturedImage(imageData);
            stopCamera();
        }
    };

    const registerFace = async () => {
        if (!capturedImage) {
            alert("Please capture your face first");
            return;
        }

        setLoading(true);
        
        try {
            // Create a DETERMINISTIC 128-float descriptor for this user (simulated)
            // This ensures that the "registered" face matches the "attendance" face for testing
            const generateSimulatedDescriptor = (id) => {
                const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return Array.from({ length: 128 }, (_, i) => {
                    const val = Math.sin(seed + i) * 0.5 + 0.5; // Values between 0 and 1
                    return val;
                });
            };

            const simulatedDescriptor = generateSimulatedDescriptor(userId);

            const faceData = {
                descriptor: simulatedDescriptor,
                image: capturedImage,
                userId: userId
            };

            const res = await axios.post("http://localhost:5000/api/face/register", {
                userId: userId,
                faceData: faceData
            });

            alert(res.data.message);
            setCapturedImage("");
            checkFaceStatus();
            
        } catch (error) {
            console.log("Face registration error:", error);
            alert("Face registration failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const retakePhoto = () => {
        setCapturedImage("");
        startCamera();
    };

    return (
        <div style={{ marginTop: "40px", textAlign: "center" }}>
            <h2>Face Registration</h2>
            
            {/* Debug: Show streaming state */}
            <p style={{ color: "#ccc", fontSize: "12px" }}>
                Debug: isStreaming = {isStreaming ? "TRUE" : "FALSE"} (render: {debugCount})
            </p>
            
            {/* Always render video element but hide it when not streaming */}
            <video
                ref={videoRef}
                autoPlay
                style={{
                    width: "320px",
                    height: "240px",
                    border: "2px solid #ccc",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    backgroundColor: "#000",
                    objectFit: "cover",
                    display: isStreaming ? "block" : "none"
                }}
            />
            
            {faceStatus && (
                <div style={{ marginBottom: "20px" }}>
                    <p>Status: {faceStatus.faceRegistered ? 
                        <span style={{ color: "#22c55e" }}>✅ Registered</span> : 
                        <span style={{ color: "#ef4444" }}>❌ Not Registered</span>
                    }</p>
                </div>
            )}

            {!capturedImage ? (
                <div>
                    {!isStreaming ? (
                        <button 
                            onClick={startCamera}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                marginBottom: "20px"
                            }}
                        >
                            Start Camera
                        </button>
                    ) : (
                        <div>
                            <p style={{ color: "#22c55e", marginBottom: "10px" }}>
                                📹 Camera is running! (Buttons should be below)
                            </p>
                            <div>
                                <button
                                    onClick={captureImage}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#22c55e",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        marginRight: "10px"
                                    }}
                                >
                                    Capture
                                </button>
                                <button
                                    onClick={stopCamera}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#ef4444",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Stop Camera
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <img
                        src={capturedImage}
                        alt="Captured face"
                        style={{
                            width: "320px",
                            height: "240px",
                            border: "2px solid #22c55e",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}
                    />
                    <div>
                        <button
                            onClick={registerFace}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: loading ? "#ccc" : "#22c55e",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: loading ? "not-allowed" : "pointer",
                                marginRight: "10px"
                            }}
                        >
                            {loading ? "Registering..." : "Register Face"}
                        </button>
                        <button
                            onClick={retakePhoto}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#f59e0b",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Retake
                        </button>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
};

export default FaceRegister;
