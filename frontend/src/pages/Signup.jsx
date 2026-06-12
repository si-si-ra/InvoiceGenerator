import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      await signup(username, email, password)
      navigate('/login')
    } catch (err) {
      console.error('Signup error:', err)
      if (err.response?.data?.username) {
        setError('Username already exists.')
      } else if (err.response?.data?.email) {
        setError('Email already exists.')
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Registration failed. Please try again.')
      } else {
        setError(err.message || 'Connection error. Please try again.')
      }
    }
  }

  return (
    <div className="login-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ minWidth: '320px', maxWidth: '420px', width: '100%' }}>
        <h2 className="card-title mb-3 text-center">Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">
            Sign Up
          </button>
        </form>
        <hr className="my-3" />
        <p className="text-center text-muted mb-0">
          Already have an account? <a href="/login" className="text-primary text-decoration-none">Sign in</a>
        </p>
      </div>
    </div>
  )
}
