import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Car } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";
import Input from "../components/Input";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form);
      toast.success("Welcome back!");
      navigate(user?.role === "driver" ? "/driver/dashboard" : "/student/dashboard");
    } catch (err) {
      const msg = err?.message || "Login failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-uber-surface border-r border-uber-border items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,0,0,0.02),transparent_50%)]" />
        <div className="relative z-10 text-center p-12">
          <div className="w-20 h-20 rounded-2xl bg-white border border-uber-border shadow-sm flex items-center justify-center mx-auto mb-6 animate-float">
            <Car size={40} className="text-uber-black" />
          </div>
          <h2 className="text-3xl font-bold text-uber-black mb-3">Welcome to Eco-Share</h2>
          <p className="text-uber-gray-500 max-w-sm">Your campus mobility platform.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-2xl bg-white border border-uber-border p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-uber-black">Sign in</h1>
              <p className="mt-1 text-sm text-uber-gray-500">Enter your credentials</p>
            </div>
            {error && (
              <div className="mb-5 rounded-xl bg-uber-red-DEFAULT/10 border border-uber-red-DEFAULT/20 px-4 py-3 text-sm text-uber-red-DEFAULT">
                ⚠️ {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" name="email" icon={<Mail size={16} />} placeholder="you@university.edu" value={form.email} onChange={handleChange} required autoComplete="email" />
              <Input label="Password" type="password" name="password" icon={<Lock size={16} />} placeholder="Enter password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
              <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
            </form>
            <p className="mt-6 text-center text-sm text-uber-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-uber-black hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
