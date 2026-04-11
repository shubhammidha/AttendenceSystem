import { useState, useRef, useEffect } from "react";
import axios from "axios";
import * as faceapi from "@vladmandic/face-api";

const FaceRegister = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceStatus, setFaceStatus] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = "https://vladmandic.github.io/face-api/model/";
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error("Error loading models:", error);
                alert("Failed to load AI models. Check your internet connection.");
            }
        };
        loadModels();
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (error) {
            console.log("Camera access error:", error);
            alert("Unable to access camera.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
    };

    const registerFace = async () => {
        if (!capturedImage) return alert("Capture face first");
        if (!modelsLoaded) return alert("AI Models still loading...");

        setLoading(true);
        try {
            // Real AI Processing
            const img = await faceapi.fetchImage(capturedImage);
            const detection = await faceapi.detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setLoading(false);
                return alert("❌ No face detected. Please try again with better lighting.");
            }

            // Convert Float32Array to regular Array for JSON transfer
            const descriptorArray = Array.from(detection.descriptor);

            const res = await axios.post("http://localhost:5000/api/face/register", {
                userId,
                faceData: {
                    descriptor: descriptorArray,
                    image: capturedImage
                }
            });

            alert("✅ " + res.data.message);
            setCapturedImage("");
            checkFaceStatus();
        } catch (error) {
            console.log("Registration error:", error);
            alert("Failed: " + (error.response?.data?.message || error.message));
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
