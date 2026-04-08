import { useState, useRef, useEffect } from "react";
import axios from "axios";
import * as faceapi from "@vladmandic/face-api";

const FaceAttendance = ({ classId, lectureId }) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [attendanceResult, setAttendanceResult] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const userId = localStorage.getItem("userId");

    // Load models on mount
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = "https://vladmandic.github.io/face-api/model/";
            try {
                console.log("Loading face-api models for attendance...");
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                console.log("Models loaded successfully");
                setModelsLoaded(true);
            } catch (error) {
                console.log("Error loading models:", error);
            }
        };
        loadModels();
    }, []);

    const refreshDashboardStats = () => {
        window.dispatchEvent(new CustomEvent('attendanceMarked', { 
            detail: { message: 'Attendance marked successfully' }
        }));
    };

    const startCamera = async () => {
        try {
            // First check if attendance is already marked
            const attendanceCheckRes = await axios.get(
                `http://localhost:5000/api/attendance/check/${userId}/${classId}`
            );
            
            if (attendanceCheckRes.data.alreadyMarked) {
                alert("✅ Attendance is already marked for today!");
                return;
            }

            // Check if attendance method is selected
            const methodCheckRes = await axios.get(
                `http://localhost:5000/api/attendance-method/active/${classId}`
            );
            
            if (!methodCheckRes.data.activeMethod || methodCheckRes.data.activeMethod === "none") {
                alert("⚠️ Teacher has not selected an attendance method yet.");
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (error) {
            console.log("Camera error:", error);
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

    const markAttendance = async () => {
        if (!userId) return alert("❌ Session not found. Log in again.");
        if (!capturedImage) return alert("Capture face first");
        if (!modelsLoaded) return alert("AI Models loading...");

        setLoading(true);
        setAttendanceResult(null);
        
        try {
            // Real AI Processing for Attendance
            const img = await faceapi.fetchImage(capturedImage);
            const detection = await faceapi.detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setLoading(false);
                return alert("❌ Face not detected in capture. Please retake photo.");
            }

            const descriptorArray = Array.from(detection.descriptor);

            const res = await axios.post("http://localhost:5000/api/face/mark-attendance", {
                userId,
                classId,
                lectureId,
                faceData: {
                    descriptor: descriptorArray,
                    image: capturedImage
                }
            });

            setAttendanceResult(res.data);
            alert("✅ " + res.data.message);
            setCapturedImage("");
            refreshDashboardStats();
            
        } catch (error) {
            console.log("Attendance error:", error);
            const errorMsg = error.response?.data?.message || error.message;
            setAttendanceResult({ error: errorMsg });
            alert("❌ " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const retakePhoto = () => {
        setCapturedImage("");
        setAttendanceResult(null);
        startCamera();
    };

    return (
        <div style={{ marginTop: "40px", textAlign: "center" }}>
            <h3>Mark Attendance via Face</h3>
            
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
                            📸 Start Camera
                        </button>
                    ) : (
                        <div>
                            <p style={{ color: "#22c55e", marginBottom: "10px" }}>
                                📹 Camera ready for face recognition!
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
                                    📸 Capture Face
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
                            onClick={markAttendance}
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
                            {loading ? "🔄 Marking..." : "✅ Mark Attendance"}
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
                            🔄 Retake
                        </button>
                    </div>
                </div>
            )}

            {/* Attendance Result */}
            {attendanceResult && (
                <div style={{ 
                    marginTop: "20px", 
                    padding: "10px", 
                    borderRadius: "4px",
                    backgroundColor: attendanceResult.error ? "#ef4444" : "#22c55e",
                    color: "white"
                }}>
                    {attendanceResult.error ? (
                        <p>❌ {attendanceResult.error}</p>
                    ) : (
                        <p>✅ {attendanceResult.message}</p>
                    )}
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
};

export default FaceAttendance;
