const Persons = ({ persons }) =>{

  return (
    <div>
      <h2>Persons</h2>
      {
        persons.map( p => 
          <div key={p.id}>
          {p.name} : {p.phone}
          </div>
        )
      }
    </div>
  )
}
export default Persons
