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




      // Store tokens in both localStorage and cookies
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      Cookies.set("accessToken", accessToken, {
        expires: 1,
        path: '/',
        secure: true,
        sameSite: 'Lax'
      });
      
      // Store user data
      localStorage.setItem("user", JSON.stringify(user));
      
      // Debug log to verify token storage
      console.log('Stored access token:', accessToken);
      console.log('Token in localStorage:', localStorage.getItem('accessToken'));
      console.log('Token in cookies:', Cookies.get('accessToken'));

      // Save department name for department admin
      if (role === "DEPARTMENT_ADMIN" && user?.department) {
        localStorage.setItem("departmentName", user.department.name || user.department);
      }

      // Update auth context with user info
      login();

      // Navigate based on role
      if (role === "DEPARTMENT_ADMIN") {
        navigate("/department-dashboard");
      } else {
        navigate("/");
      }

    } catch (err) {
      console.log('Error during OTP verification or login:', err);
      setError(err.response?.data?.message || 'Invalid OTP or login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 overflow-hidden">
      <div className="relative w-[500px] h-[500px] flex justify-center items-center">
        {/* Animated rings */}
        <div className="absolute inset-0 border-2 border-white rounded-[38%_62%_63%_37%/41%_44%_56%_59%] animate-[spin_6s_linear_infinite] hover:border-[#00ff0a] hover:border-4 hover:shadow-[0_0_20px_#00ff0a]"></div>
        <div className="absolute inset-0 border-2 border-white rounded-[41%_44%_56%_59%/38%_62%_63%_37%] animate-[spin_4s_linear_infinite] hover:border-[#ff0057] hover:border-4 hover:shadow-[0_0_20px_#ff0057]"></div>
        <div className="absolute inset-0 border-2 border-white rounded-[41%_44%_56%_59%/38%_62%_63%_37%] animate-[reverse-spin_10s_linear_infinite] hover:border-[#fffd44] hover:border-4 hover:shadow-[0_0_20px_#fffd44]"></div>
        
        {/* Login form */}
        <div className="w-[300px] flex flex-col justify-center items-center gap-5 z-10">
          <h2 className="text-3xl font-bold text-white">Admin/Department OTP Login</h2>
          <p className="text-white/75">Sign in with your mobile number and OTP</p>

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
          <div className="w-full">
            <select
              className="w-full px-5 py-3 bg-transparent border-2 border-white rounded-full text-lg text-white focus:outline-none focus:border-[#00ff0a] focus:shadow-[0_0_20px_#00ff0a] transition-all"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="DEPARTMENT_ADMIN" className="text-gray-800">Department</option>
              <option value="MUNICIPAL_ADMIN" className="text-gray-800">Municipal Admin</option>
            </select>
          </div>

          <div className="w-full">
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full px-5 py-3 bg-transparent border-2 border-white rounded-full text-lg text-white placeholder:text-white/75 focus:outline-none focus:border-[#ff0057] focus:shadow-[0_0_20px_#ff0057] transition-all"
              placeholder="Enter mobile number"
              required
              disabled={otpSent}
            />
          </div>

          {otpSent && (
            <div className="w-full">
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-5 py-3 bg-transparent border-2 border-white rounded-full text-lg text-white placeholder:text-white/75 focus:outline-none focus:border-[#fffd44] focus:shadow-[0_0_20px_#fffd44] transition-all"
                placeholder="Enter OTP"
                required
              />
            </div>
          )}

          {error && (
            <div className="w-full px-5 py-3 border-2 border-red-500 rounded-full text-red-500 text-center bg-red-500/10">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-5 py-3 bg-gradient-to-r from-[#ff357a] to-[#fff172] text-white rounded-full text-lg font-medium hover:shadow-[0_0_20px_#ff357a] transition-all duration-300"
            disabled={loading}
          >
            {otpSent ? (loading ? 'Verifying...' : 'Login') : (loading ? 'Sending OTP...' : 'Send OTP')}
          </button>

         
        </form>
      </div>
    </div>
  </div>
  );
}

export default Login;