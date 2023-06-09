import React from "react";
import ndjsonStream from "can-ndjson-stream";
import { useEffect, useState, useRef } from "react";
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

let stream;
let toggleStreamContinue = true;
let ndjsonStreamer;
let TIME_INTERVAL_BETWEEN_LOADS = 1000; // 1 second
let PAGE_SIZE = 0; // number of batches per page or 0 for only the latest batch

const fetchNdjson = (opts) => {
  const { url, setValues, setIsLoading } = opts;
  console.log("fetching");
  let streamedValues = [];
  let moreData = [];
  let loadInitial = true;

  (async () => {
    const response = await fetch(url);
    ndjsonStreamer = ndjsonStream(response.body).getReader();

    let result;

    while (
      (!result || !result.done) &&
      loadInitial &&
      streamedValues.length < INITIAL_LOAD
    ) {
      if (toggleStreamContinue) {
        result = await ndjsonStreamer.read();
        streamedValues.push(result.value);
      } else {
        break;
      }
      if (streamedValues.length === INITIAL_LOAD) {
        setValues(streamedValues);
      }
      loadInitial = false;
      setIsLoading(false);
    }

    const loadMore = async () => {
      while (!result.done && moreData.length < LOAD_INCREMENT) {
        if (toggleStreamContinue) {
          result = await ndjsonStreamer.read();
          moreData.push(result.value);
        } else {
          break;
        }
      }

      if (moreData.length === LOAD_INCREMENT && !result.done) {
        setValues((prev) => {
          const temp = moreData;
          moreData = [];
          // console.log(prev.length);
          console.log("another batch", PAGE_SIZE, prev.length);
          return [
            ...(prev.length <= PAGE_SIZE && PAGE_SIZE !== 0 ? prev : []),
            temp,
          ];
        });
      }

      // recurse until complete
      if (!result.done) {
        setTimeout(async () => {
          await loadMore();
          //  window.scrollTo(0, document.body.scrollHeight);
        }, TIME_INTERVAL_BETWEEN_LOADS);
      }
    };

    if (!result.done) await loadMore();
  })();
};

export default () => {
  const [currentDataSource, setCurrentDataSource] = useState(testPayLoadURL);
  const [currentStreamSpeed, setCurrentStreamSpeed] = useState(
    TIME_INTERVAL_BETWEEN_LOADS
  );
  const [val, setVal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggleContinue, setToggleContinue] = useState(toggleStreamContinue);

  useEffect(() => {
    const opts = {
      url: currentDataSource,
      setValues: setVal,
      setIsLoading,
    };
    stream = fetchNdjson(opts);
  }, []);

  const handlePauseButtonClick = () => {
    console.log("ive been clicked");
    toggleStreamContinue = !toggleContinue;
    setToggleContinue(!toggleContinue);
    console.log(toggleContinue);
  };

  const showPauseButton = () => {
    return (
      <button onClick={handlePauseButtonClick}>
        {toggleContinue ? "Pause" : "Continue"}
      </button>
    );
  };

  const formDataSource = useRef();
  const formStreamSpeed = useRef();
  const formStreamPageSize = useRef();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const inputDataSource = formDataSource.current.value;
    const inputStreamSpeed = formStreamSpeed.current.value;
    const inputPageSize = formStreamPageSize.current.value;

    console.log(inputDataSource, inputStreamSpeed, inputPageSize);

    if (inputDataSource) {
      const newURL = new URL(inputDataSource); // serialize URL
      setCurrentDataSource(newURL.href);
      const opts = {
        url: newURL?.href,
        setValues: setVal,
        setIsLoading,
      };
      stream = fetchNdjson(opts);
    }

    if (inputStreamSpeed) {
      const newStreamSpeed = Number(inputStreamSpeed);
      setCurrentStreamSpeed(newStreamSpeed);
      TIME_INTERVAL_BETWEEN_LOADS = newStreamSpeed;
    }

    if (inputPageSize) {
      PAGE_SIZE = inputPageSize;
    }
  };
  const showForm = () => (
    <div className="mainForm">
      <h3>Update Stream</h3>
      <form onSubmit={handleFormSubmit}>
        <label>
          <input
            ref={formDataSource}
            type="text"
            placeholder="Data source url"
          />
        </label>
        <label>
          <input
            ref={formStreamSpeed}
            type="text"
            placeholder="Stream speed (in ms)"
          />
        </label>
        <label>
          <input
            ref={formStreamPageSize}
            type="text"
            placeholder="# of batches per page"
            title="Set to 0 for ticker, high number may cause memory issues"
          />
        </label>
        <input type="submit" value="Submit" />
      </form>
      <p>
        Note: Update the current stream using the form above. The number of
        batches when set to 0 returns a ticker (new batch per page). <br />
        <br />
        WARN: A very high number of batches per page will cause memory issues.
      </p>
    </div>
  );

  return isLoading ? (
    `loading`
  ) : (
    <>
      <div className="mainContainer">
        <h1>React NDJSON Streamer Example</h1>
        <h2>{showPauseButton()}Streaming Results:</h2>
        <div className="topInfo">
          Current DataSource: {currentDataSource} | Speed: {currentStreamSpeed}
          ms
          <br />
          <br />
          {showForm()}
          Other Examples:
          <br />
          https://dl.dropboxusercontent.com/s/gxbsj271j5pevec/trades.json
          <br />
          https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets/city_inspections.json
        </div>
        {currentDataSource === testPayLoadURL && (
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
                      //   !obj?.result && console.log(obj);
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
                          {obj?.address &&
                            `${obj?.address?.number} ${obj?.address?.street} ${obj?.address?.city}`.toLowerCase()}
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
        )}
        {currentDataSource !== testPayLoadURL && JSON.stringify(val)}
      </div>
    </>
  );
};

// More info on can-ndjson-stream's API
// https://canjs.com/doc/can-ndjson-stream.html
// More info on NDJSON performance improvements
// https://davidwalsh.name/streaming-data-fetch-ndjson
// https://www.reddit.com/r/learnreactjs/comments/lx7hvu/how_do_you_fetch_a_stream_of_data_in_a_react_app/
