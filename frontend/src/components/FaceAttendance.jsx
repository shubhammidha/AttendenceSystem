import { useState, useRef, useEffect } from "react";
import axios from "axios";

const FaceAttendance = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [classId, setClassId] = useState("69c188592fda59eb47432e5c");
    const [attendanceResult, setAttendanceResult] = useState(null);
    const [debugCount, setDebugCount] = useState(0);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const userId = localStorage.getItem("userId");

    // Function to refresh dashboard stats
    const refreshDashboardStats = () => {
        window.dispatchEvent(new CustomEvent('attendanceMarked', { 
            detail: { message: 'Attendance marked successfully' }
        }));
    };

    const startCamera = async () => {
        try {
            console.log("Starting camera for attendance...");
            
            // First check if attendance is already marked
            const attendanceCheckRes = await axios.get(
                `http://localhost:5000/api/attendance/check/${userId}/${classId}`
            );
            
            if (attendanceCheckRes.data.alreadyMarked) {
                alert("✅ Attendance is already marked for today!");
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
            });
            
            console.log("Got stream:", stream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                console.log("Set srcObject for attendance");
                
                // Force state change immediately
                console.log("Force setting isStreaming to TRUE for attendance");
                setIsStreaming(true);
                setDebugCount(prev => prev + 1);
                
                // Try to play video
                videoRef.current.play().then(() => {
                    console.log("Video playing successfully for attendance");
                }).catch(err => {
                    console.log("Video play error for attendance:", err);
                });
            } else {
                console.log("ERROR: videoRef.current is null for attendance!");
            }
        } catch (error) {
            console.log("Camera access error for attendance:", error);
            if (error.response?.status === 400 && error.response?.data?.message?.includes("already marked")) {
                alert("✅ Attendance is already marked for today!");
            } else {
                alert("Unable to access camera. Please check permissions.");
            }
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

    const markAttendance = async () => {
        if (!capturedImage) {
            alert("Please capture your face first");
            return;
        }

        if (!classId) {
            alert("Please enter class ID");
            return;
        }

        setLoading(true);
        setAttendanceResult(null);
        
        try {
            // Simulate face data extraction
            const faceData = {
                descriptor: "simulated-face-descriptor-" + Date.now(),
                image: capturedImage
            };

            const res = await axios.post("http://localhost:5000/api/face/mark-attendance", {
                userId: userId,
                classId: classId,
                faceData: faceData
            });

            setAttendanceResult(res.data);
            alert("✅ " + res.data.message);
            setCapturedImage("");
            
            // Refresh dashboard stats
            refreshDashboardStats();
            
        } catch (error) {
            console.log("Face attendance error:", error);
            const errorMsg = error.response?.data?.message || error.message;
            setAttendanceResult({ error: errorMsg });
            alert("❌ Face attendance failed: " + errorMsg);
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
            
            {/* Debug: Show streaming state */}
            <p style={{ color: "#ccc", fontSize: "12px" }}>
                Debug: isStreaming = {isStreaming ? "TRUE" : "FALSE"} (render: {debugCount})
            </p>

            {/* Class ID Input */}
            <div style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Enter Class ID"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        marginRight: "10px",
                        width: "200px"
                    }}
                />
            </div>
            
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
