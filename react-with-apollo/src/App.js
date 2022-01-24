import { useState } from 'react'
import { useQuery, useApolloClient } from '@apollo/client'
import Persons from './components/Persons' 
import PersonForm from './components/PersonForm'
import PhoneForm from './components/PhoneForm'
import { ALL_PERSONS } from './util/query.js'
import LoginForm from './components/LoginForm.js'

const App = () => {
  const [ errorMessage, setErrorMessage ] = useState(null)
  const result = useQuery(ALL_PERSONS, {
    //  pollInterval: 2000 
    //  hace una peticion cada tiempo(la cantidad indicada ) de los datos al servidor
  })
  const client = useApolloClient()
  const [ token, setToken ] = useState(null)
  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }
 
  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }
 
  if (result.loading)  {
    return <div>loading...</div>
  }
  if(!token){
    return (
      <div>
        <Notify errorMessage={errorMessage}/>
        <h2> Login </h2>
        <LoginForm
          setToken={setToken}
          setError={notify}
        />
      </div>
    )
  }

  if(result.data){
    return (<>
      <button onClick={logout} >Logout</button>
      <Notify errorMessage={errorMessage} />
      <Persons persons={result.data.allPersons} />
      <PersonForm setError={ notify } />
      <PhoneForm setError={ notify }/>
    </>)
  }
    return(<>
      <h1>Connection lost</h1>
    </>)
 }
 const Notify = ({errorMessage}) => {
    if ( !errorMessage ){
      return null
    }
    return (
      <div style={{color: 'red'}}>
        {errorMessage}
      </div>
    )
  }

export default App
