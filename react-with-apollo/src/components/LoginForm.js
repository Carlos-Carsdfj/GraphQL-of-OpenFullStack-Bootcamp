import { useEffect, useState } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN } from '../util/query.js'

const LoginForm = ({ setToken, setError })=>{
  const [ username, setUsername ] = useState('')
  const [ password, setPassword ] = useState('')
  const [login, result  ] = useMutation(LOGIN,{
    onError: (error)=>{

      if(error.graphQLErrors[0]){
        setError(error.graphQLErrors[0].message | error)
      }
    }
  })

  useEffect(()=>{
    if(result.data){
      const token = result.data.login.value
      setToken(token)
      localStorage.setItem('phonenumbers-user-token', token)
    }
  },[result.data])//eslint-disable-line

  const submit = (ev)=>{
    ev.preventDefault()
    login({ variables:{username, password}})
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          username <input
            value={username}
            onChange={({ target:{ value } }) => setUsername(value)}
          />
        </div>
        <div>
          password <input
            type='password'
            value={password}
            onChange={({ target:{ value } }) => setPassword(value)}
          />
        </div>
        <button type='submit'>login</button>
      </form>
    </div>
  )
}



export default LoginForm 
