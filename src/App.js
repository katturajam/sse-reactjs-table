import React from 'react'

import CssBaseline from '@material-ui/core/CssBaseline'
import EnhancedTable from './components/EnhancedTable'

const App = () => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'First Name',
        accessor: 'firstName',
      },
      {
        Header: 'Last Name',
        accessor: 'lastName',
      },
      {
        Header: 'Age',
        accessor: 'age',
      },
      {
        Header: 'Visits',
        accessor: 'visits',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Profile Progress',
        accessor: 'progress',
      },
    ],
    []
  )
  
  let [data, setData] = React.useState([])
  const [skipPageReset, setSkipPageReset] = React.useState(false)
  const [listening, setListening] = React.useState(false)
  let eventCounter=1, eventBindThreshold=10, eventRecord=0;
  React.useEffect(() => {
    if(!listening) {
      const eventSource = new EventSource('http://localhost:3001/events');
        eventSource.onerror = (event) => { 
          eventSource.close();
        }
        eventSource.onmessage = function(event) {
          console.log("Connection Opened");
        };
        eventSource.addEventListener("update", function(event) {
          console.log('Updat Event');
          if(eventCounter >= eventBindThreshold) {
              data = [...data, ...JSON.parse(event.data)];
              setData([...data, data[data.length-1]]);
              eventCounter=1; //Reset
          } else {
            data = [...data, ...JSON.parse(event.data)];
            eventCounter++;
          }
          eventRecord++;
        });
        eventSource.addEventListener("close", function(event) {
            console.log("Connection Closed");
            eventSource.close();
            console.log(`Total update event: ${eventRecord}, Total record: ${data.length}`);
            let lastData = data.pop();
            setData([...data, lastData])
      });
      setListening(true);
    }
  }, [listening, data])

  // We need to keep the table from resetting the pageIndex when we
  // Update data. So we can keep track of that flag with a ref.

  // When our cell renderer calls updateMyData, we'll use
  // the rowIndex, columnId and new value to update the
  // original data
  const updateMyData = (rowIndex, columnId, value) => {
    // We also turn on the flag to not reset the page
    setSkipPageReset(true)
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          }
        }
        return row
      })
    )
  }

  return (
    <div>
      <CssBaseline />
      <EnhancedTable
        columns={columns}
        data={data}
        setData={setData}
        updateMyData={updateMyData}
        skipPageReset={skipPageReset}
      />
    </div>
  )
}

export default App
