import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      const response = await login(username, password)
      const { access, refresh } = response.data
      localStorage.setItem('jwtToken', access)
      localStorage.setItem('refreshToken', refresh)
      // Dispatch storage event to notify other components
      window.dispatchEvent(new Event('storage'))
      navigate('/')
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="login-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ minWidth: '320px', maxWidth: '420px', width: '100%' }}>
        <h2 className="card-title mb-3 text-center">Sign In</h2>
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
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">
            Sign In
          </button>
        </form>
        <hr className="my-3" />
        <p className="text-center text-muted mb-0">
          Don't have an account? <a href="/signup" className="text-primary text-decoration-none">Sign up</a>
        </p>
      </div>
    </div>
  )
}
