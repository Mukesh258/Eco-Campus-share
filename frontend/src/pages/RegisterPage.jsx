import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Car, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";
import Input from "../components/Input";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      toast.success("Account created! Welcome to Eco-Share 🌿");
      navigate(user?.role === "driver" ? "/driver/dashboard" : "/student/dashboard");
    } catch (err) {
      const msg = err?.message || "Registration failed.";
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
            <User size={40} className="text-uber-black" />
          </div>
          <h2 className="text-3xl font-bold text-uber-black mb-3">Join Eco-Share</h2>
          <p className="text-uber-gray-500 max-w-sm">Start your green commute today. Free forever.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-2xl bg-white border border-uber-border p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-uber-black">Create account</h1>
              <p className="mt-1 text-sm text-uber-gray-500">Join the campus mobility revolution</p>
            </div>
            {error && (
              <div className="mb-4 rounded-xl bg-uber-red-DEFAULT/10 border border-uber-red-DEFAULT/20 px-4 py-3 text-sm text-uber-red-DEFAULT">
                ⚠️ {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" type="text" name="name" icon={<User size={16} />} placeholder="Your name" value={form.name} onChange={handleChange} required autoComplete="name" />
              <Input label="Email address" type="email" name="email" icon={<Mail size={16} />} placeholder="you@university.edu" value={form.email} onChange={handleChange} required autoComplete="email" />
              <Input label="Password" type="password" name="password" icon={<Lock size={16} />} placeholder="At least 6 characters" value={form.password} onChange={handleChange} required autoComplete="new-password" />
              <div>
                <label className="block text-sm font-medium text-uber-gray-300 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm(p => ({...p, role: "student"}))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${form.role === "student" ? "bg-uber-black/5 border-uber-black text-uber-black" : "bg-uber-surface border-uber-border text-uber-gray-500 hover:border-uber-gray-300"}`}>
                    <GraduationCap size={18} /> Student
                  </button>
                  <button type="button" onClick={() => setForm(p => ({...p, role: "driver"}))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${form.role === "driver" ? "bg-uber-black/5 border-uber-black text-uber-black" : "bg-uber-surface border-uber-border text-uber-gray-500 hover:border-uber-gray-300"}`}>
                    <Car size={18} /> Driver
                  </button>
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">Create account</Button>
            </form>
            <div className="mt-5 rounded-xl bg-uber-green-DEFAULT/5 border border-uber-green-DEFAULT/20 p-3 text-xs text-uber-green-dark text-center font-medium">
              🌿 By joining, you help reduce campus carbon footprint.
            </div>
            <p className="mt-4 text-center text-sm text-uber-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-uber-black hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
