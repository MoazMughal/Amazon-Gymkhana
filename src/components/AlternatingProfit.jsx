import { useState, useEffect } from 'react'

const AlternatingProfit = ({ monthlyProfit, yearlyProfit }) => {
  const [showPKR, setShowPKR] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowPKR(prev => !prev)
    }, 3000) // Switch every 3 seconds

    return () => clearInterval(interval)
  }, [])

  const monthlyPKR = Math.round(monthlyProfit * 350)
  const yearlyPKR = Math.round(yearlyProfit * 350)

  return (
    <div className="profit-display" style={{marginTop: '6px', padding: '6px', background: '#f8f9fa', borderLeft: '3px solid #28a745', borderRadius: '6px', fontSize: '.8rem'}}>
      <div className="profit-row" style={{display: 'flex', justifyContent: 'space-between'}}>
        <span className="profit-label">Monthly Profit:</span>
        <span className="profit-value blink" style={{fontWeight: '700', color: '#28a745'}}>
          {showPKR ? `₨${monthlyPKR.toLocaleString()}` : `£${monthlyProfit}`}
        </span>
      </div>
      <div className="profit-row" style={{display: 'flex', justifyContent: 'space-between'}}>
        <span className="profit-label">Yearly Profit:</span>
        <span className="profit-value" style={{fontWeight: '700', color: '#28a745'}}>
          {showPKR ? `₨${yearlyPKR.toLocaleString()}` : `£${yearlyProfit.toLocaleString()}`}
        </span>
      </div>
    </div>
  )
}

export default AlternatingProfit
