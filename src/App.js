import React from "react";
import ndjsonStream from "can-ndjson-stream";
import { useEffect, useState } from "react";
import * as uuid from "uuid";

const baseURL =
  //  "https://raw.githubusercontent.com/json-iterator/test-data/master";
  // "https://dl.dropboxusercontent.com/s/gxbsj271j5pevec";
  "https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets";

const URLPath =
  // "large-file.json"
  //  "trades.json"; // has 1 million rows (243MB JSON)
  "city_inspections.json";

const testPayLoadURL = `${baseURL}/${URLPath}`;

const INITIAL_LOAD = 100;
const LOAD_INCREMENT = 50;
const TIME_INTERVAL_BETWEEN_LOADS = 0; // 1 second

const fetchNdjson = (val, setVal) => {
  console.log("fetching");
  let streamedValues = [];
  let moreData = [];
  let loadInitial = true;

  (async () => {
    const response = await fetch(testPayLoadURL);
    const exampleReader = ndjsonStream(response.body).getReader();

    let result;

    while (
      (!result || !result.done) &&
      loadInitial &&
      streamedValues.length < INITIAL_LOAD
    ) {
      result = await exampleReader.read();
      streamedValues.push(result.value);

      if (streamedValues.length === INITIAL_LOAD) {
        setVal((prev) => {
          return [...prev, streamedValues];
        });
      }
      loadInitial = false;
    }

    const loadMore = async () => {
      while (moreData.length < LOAD_INCREMENT) {
        result = await exampleReader.read();
        moreData.push(result.value);
      }

      if (moreData.length === LOAD_INCREMENT) {
        setVal((prev) => {
          const temp = moreData;
          moreData = [];
          // console.log(prev.length);
          return [...(prev.length < 0 ? prev : []), temp];
        });
      }

      // recurse until complete
      if (!result.done)
        setTimeout(async () => {
          await loadMore();
          //  window.scrollTo(0, document.body.scrollHeight);
          console.log("another batch");
        }, TIME_INTERVAL_BETWEEN_LOADS);
    };

    if (!result.done) await loadMore();
  })();
};

export default () => {
  const [val, setVal] = useState([]);

  useEffect(() => {
    fetchNdjson(val, setVal);
  }, []);

  return (
    <>
      <h2>Streaming Results:</h2>
      <table className="streamTable">
        <tbody>
          <tr>
            <th>Business Name</th>
            <th>Business Sector</th>
            <th>Address</th>
            <th>Result</th>
          </tr>
          <tr>
            <td>
              {val.map((arr) =>
                arr.map((obj) => {
                  return <div key={uuid.v1()}>{obj?.business_name}</div>;
                })
              )}
            </td>
            <td>
              {val.map((arr) =>
                arr.map((obj) => {
                  return <div key={uuid.v1()}>{obj?.sector}</div>;
                })
              )}
            </td>
            <td>
              {val.map((arr) =>
                arr.map((obj) => {
                  return (
                    <div key={uuid.v1()}>
                      {`${obj?.address?.number} ${obj?.address?.street} ${obj?.address?.city}`.toLowerCase()}
                    </div>
                  );
                })
              )}
            </td>
            <td>
              {val.map((arr) =>
                arr.map((obj) => {
                  return <div key={uuid.v1()}>{`${obj?.result}`}</div>;
                })
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

// More info on can-ndjson-stream's API
// https://canjs.com/doc/can-ndjson-stream.html
// More info on NDJSON performance improvements
// https://davidwalsh.name/streaming-data-fetch-ndjson
// https://www.reddit.com/r/learnreactjs/comments/lx7hvu/how_do_you_fetch_a_stream_of_data_in_a_react_app/
