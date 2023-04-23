import React from "react";
import ndjsonStream from "can-ndjson-stream";
import { useEffect, useState } from "react";

const baseURL =
  //  "https://raw.githubusercontent.com/json-iterator/test-data/master";
  "https://dl.dropboxusercontent.com/s/gxbsj271j5pevec";
//"https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets";

const URLPath =
  // "large-file.json"
  "trades.json";
//"city_inspections.json";

const testPayLoadURL = `${baseURL}/${URLPath}`;

const INITIAL_LOAD = 1;
const LOAD_INCREMENT = 10;

const fetchNdjson = (setval, count, setCount, more, setMore) => {
  console.log("fetching");
  let streamedValues = [];
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
      setCount(count++);
      result = await exampleReader.read();
      streamedValues.push(result.value);
      console.log("first 1 values");
      if (streamedValues.length === INITIAL_LOAD) {
        setval((prev) => {
          return [...prev, streamedValues];
        });
      }
      loadInitial = false;
      console.log(
        count,
        result.value?.id,
        result.done,
        result.value,
        streamedValues.length
      );
    }
    const loadMore = async () => {
      let moreData = [];
      result = await exampleReader.read();
      moreData.push(result.value);
      console.log("loading more!!!");
      setval((prev) => {
        return [...prev, moreData];
      });

      // recurse until complete
      if (!result.done)
        setTimeout(async () => {
          await loadMore();
          console.log("another batch");
        }, 1000);
    };

    if (!result.done) await loadMore();
  })();

  // (async () => {
  //   const response = await fetch(testPayLoadURL);
  //   const exampleReader = ndjsonStream(response.body).getReader();
  //
  //   let result;
  //   console.log("reading");
  //   while (
  //     (!result || !result.done) &&
  //     streamedValues.length <= LOAD_INCREMENT
  //   ) {
  //     setCount(count++);
  //     result = await exampleReader.read();
  //     streamedValues.push(result.value);
  //     console.log("more values");
  //     setval((prev) => {
  //       return [...prev, streamedValues];
  //     });
  //
  //     console.log(
  //       count,
  //       result.value?.id,
  //       result.done,
  //       result.value,
  //       streamedValues.length
  //     );
  //   }
  // })();
};

export default () => {
  const [val, setVal] = useState([]);
  const [count, setCount] = useState(0);
  const [more, setMore] = useState(false);

  let initial = false;

  useEffect(() => {
    fetchNdjson(setVal, count, setCount, more, setMore);
  }, []);

  return (
    <>
      <h1>The value is:</h1>
      {JSON.stringify(initial)}
      {JSON.stringify(val)}
    </>
  );
};
