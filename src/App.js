import React from "react";
import ndjsonStream from "can-ndjson-stream";
import { useEffect, useState } from "react";

const baseURL =
  //  "https://raw.githubusercontent.com/json-iterator/test-data/master";
  "https://dl.dropboxusercontent.com/s/gxbsj271j5pevec";
//"https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets";

const URLPath =
  // "large-file.json"
  "trades.json"; // has 1 million rows (243MB JSON)
//"city_inspections.json";

const testPayLoadURL = `${baseURL}/${URLPath}`;

const INITIAL_LOAD = 10;
const LOAD_INCREMENT = 1000;
const TIME_INTERVAL_BETWEEN_LOADS = 1000; // 1 second

const fetchNdjson = (setVal) => {
  console.log("fetching");
  let streamedValues = [];
  let moreData = [];
  let loadInitial = true;

  (async () => {
    const response = await fetch(testPayLoadURL);
    const exampleReader = ndjsonStream(response.body).getReader();

    let result;
    console.log("reading");
    while (
      (!result || !result.done) &&
      loadInitial &&
      streamedValues.length < INITIAL_LOAD
    ) {
      result = await exampleReader.read();
      streamedValues.push(result.value);
      console.log("first number of values");
      if (streamedValues.length === INITIAL_LOAD) {
        setVal((prev) => {
          return [...prev, streamedValues];
        });
      }
      loadInitial = false;
      console.log(
        result.value?.id,
        result.done,
        result.value,
        streamedValues.length
      );
    }

    const loadMore = async () => {
      while (moreData.length < LOAD_INCREMENT) {
        result = await exampleReader.read();
        moreData.push(result.value);
        console.log("loading more!!!", result.value?._id?.$oid);
      }

      if (moreData.length === LOAD_INCREMENT) {
        setVal((prev) => {
          const temp = moreData;
          moreData = [];
          return [...prev, temp];
        });
      }

      // recurse until complete
      if (!result.done)
        setTimeout(async () => {
          await loadMore();
          console.log("another batch");
        }, TIME_INTERVAL_BETWEEN_LOADS);
    };

    if (!result.done) await loadMore();
  })();
};

export default () => {
  const [val, setVal] = useState([]);

  useEffect(() => {
    fetchNdjson(setVal);
  }, []);

  return (
    <>
      <h2>Streaming Results:</h2>
      {JSON.stringify(val)}
      {/*{JSON.stringify(*/}
      {/*  val.map((obj) => {*/}
      {/*    const el = obj[0];*/}
      {/*    console.log("ALL", obj);*/}
      {/*    // const { _id, price, ticker, shares } = el;*/}
      {/*    if (el) {*/}
      {/*      return `ID: ${el?._id.$oid}: The price is ${el?.price} for ${el?.ticker} with ${el?.shares} shares.`;*/}
      {/*    }*/}
      {/*  })*/}
      {/*)}*/}
    </>
  );
};

// More info on can-ndjson-stream's API
// https://canjs.com/doc/can-ndjson-stream.html
// More info on NDJSON performance improvements
// https://davidwalsh.name/streaming-data-fetch-ndjson
// https://www.reddit.com/r/learnreactjs/comments/lx7hvu/how_do_you_fetch_a_stream_of_data_in_a_react_app/
