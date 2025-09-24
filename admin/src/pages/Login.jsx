import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import Cookies from "js-cookie";


const Login = () => {
  const [role, setRole] = useState('DEPARTMENT_ADMIN');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Send OTP using backend API
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('Sending OTP to:', mobile);
      const res = await api.post('/otp/send', { mobileNumber: mobile });
      console.log('OTP send response:', res.data);
      setVerificationId(res.data.verificationId || res.data.data?.verificationId || '');
      setOtpSent(true);
    } catch (err) {
      console.log('Error sending OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP using backend API, then login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Step 1: Verify OTP
      const payload = {
        mobileNumber: mobile,
        verificationId,
        code: otp
      };
      console.log('Verifying OTP with payload:', payload);
      const verifyRes = await api.post('/otp/verify', payload);
      console.log('OTP verify response:', verifyRes.data);

      // Step 2: Login with mobile number
      console.log('Logging in with mobile number:', mobile);
      const loginRes = await api.post('/users/login', { mobileNumber: mobile });
      console.log('Login response:', loginRes.data);
      // Assuming loginRes.data contains token and user info
      const { accessToken, refreshToken, user } = loginRes.data.data;




      // Store tokens in cookies (expires: 1 day for access, 7 days for refresh)
      Cookies.set("accessToken", accessToken, {
        expires: 1,
        secure: true,
        sameSite: "strict",
        path: "/"
      });
      Cookies.set("refreshToken", refreshToken, {
        expires: 7,
        secure: true,
        sameSite: "strict",
        path: "/"
      });


      // Store accessToken in localStorage as 'token' for department dashboard API calls
      localStorage.setItem("token", accessToken);

      // Save department name for dashboard API calls (if department admin)
      if (role === "DEPARTMENT_ADMIN" && user?.department) {
        localStorage.setItem("departmentName", user.department.name || user.department);
      }

      // Save token/user as needed (e.g., in context or localStorage)
      login();
      // Route to department dashboard if department admin, else home
      if (role === "DEPARTMENT_ADMIN") {
        navigate("/department-dashboard");
      } else {
        navigate("/");
      }


  // Save token/user as needed (e.g., in context or localStorage)
  login();
  navigate("/");

    } catch (err) {
      console.log('Error during OTP verification or login:', err);
      setError(err.response?.data?.message || 'Invalid OTP or login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-3">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 flex flex-col justify-center items-center">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Admin/Department OTP Login</h2>
          <p className="text-gray-600 mt-2">Sign in with your mobile number and OTP</p>
        </div>

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Login as</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 bg-white"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="DEPARTMENT_ADMIN" className="text-gray-800 bg-white">Department</option>
              <option value="MUNICIPAL_ADMIN" className="text-gray-800 bg-white">Municipal Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Enter mobile number"
              required
              disabled={otpSent}
            />
          </div>

          {otpSent && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-2 border #000000 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter OTP"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            disabled={loading}
          >
            {otpSent ? (loading ? 'Verifying...' : 'Login') : (loading ? 'Sending OTP...' : 'Send OTP')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;