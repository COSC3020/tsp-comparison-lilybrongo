//Combinging my own code, Collin Davis's held-karp code, and swilso59's testing code

const fs = require('fs');

// Add timing and logging
function tsp_hk_with_runtime(distance_matrix) {
    const startTime = performance.now();
    const minTourLength = tsp_hk(distance_matrix);
    const endTime = performance.now();
    const runtime = endTime - startTime;

    console.log(`Held-Karp: Tour Length = ${minTourLength}, Runtime = ${runtime.toFixed(2)} ms`);
    return { tourLength: minTourLength, runtime };
}

function tsp_ls_with_runtime(distance_matrix) {
    const startTime = performance.now();
    const bestDistance = tsp_ls(distance_matrix);
    const endTime = performance.now();
    const runtime = endTime - startTime;

    console.log(`Local Search: Tour Length = ${bestDistance}, Runtime = ${runtime.toFixed(2)} ms`);
    return { tourLength: bestDistance, runtime };
}

function generateDistanceMatrix(size) {
    const matrix = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1)
    );
    for (let i = 0; i < size; i++) {
        for (let j = i; j < size; j++) {
            if (i === j) {
                matrix[i][j] = 0; // No self-loops
            } else {
                matrix[j][i] = matrix[i][j]; // Symmetric
            }
        }
    }
    return matrix;
}

// Main execution
const results = [];

for (let size = 1; size <= 19; size++) {
    console.log(`Generating matrix for size ${size}...`);
    const matrix = generateDistanceMatrix(size);

    console.log(`Running Held-Karp on ${size}x${size} matrix...`);
    const hkResult = tsp_hk_with_runtime(matrix);

    console.log(`Running Local Search on ${size}x${size} matrix...`);
    const lsResult = tsp_ls_with_runtime(matrix);

    results.push({
        size,
        heldKarp: hkResult,
        localSearch: lsResult
    });
}

console.table(results);

// Save results to CSV
const csvContent = [
    'Size,Held-Karp Runtime (ms),Held-Karp Tour Length,Local Search Runtime (ms),Local Search Tour Length',
    ...results.map(({ size, heldKarp, localSearch }) =>
        `${size},${heldKarp.runtime},${heldKarp.tourLength},${localSearch.runtime},${localSearch.tourLength}`
    )
].join('\n');

fs.writeFileSync('results.csv', csvContent);
console.log('Results saved to results.csv');


function tsp_ls(distance_matrix) {

    //need to check if there are no cities or if there is one city
        if (distance_matrix.length === 0) {
            return 0;
        }
    
        if (distance_matrix.length === 1) {
            return 0;
        }
    
    // we need to generate a random starting route
        const n = distance_matrix.length;
        function randomStart(n) {
            let route = Array.from(Array(n).keys());
            for (let i = n -1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [route[i], route[j]] = [route[j], route[i]];
            }
            return route;
        }
    //we need to figure out the total calculation for the route
        function calculateRoute(route) {
            let distance = 0;
            for (let i = 0; i < route.length -1; i++) {
                distance += distance_matrix[route[i]][route[i + 1]];
            }
            return distance;
        }
    //this is a requirement
    //need to maintain and swap    
    // ```javascript
    // 2optSwap(route, i, k)
    //   cities 1 to i-1 stay in the order they are
    //   cities i to k are reversed
    //   cities k + 1 to n stay in the order they are
    // ``
        function twoOptSwap(route, i, k) {
            let newRoute = route.slice(0, i);
            let swapped = route.slice(i, k + 1).reverse();
            return newRoute.concat(swapped, route.slice(k + 1));
        }
    
        //main functionality 
        let route = randomStart(n); // Start with a random route
        //initilizing the stopping criteria: if false keep looking, if true yay end running
        let improved = true;
    
        while (improved) {
            improved = false;
            //requirement
            for (let i = 0; i < n - 1; i++) {
                for (let k = i + 1; k < n; k++) {
                    let newRoute = twoOptSwap(route, i, k); // Try a 2-opt swap
                    if (calculateRoute(newRoute) < calculateRoute(route)) {
                        route = newRoute; // Keep the new route if it's better
                        improved = true;
                        //console.log('route length:', route);
                    }
                }
            }
        }
        // Return the shortest distance found
        return calculateRoute(route);
    }

    //held-karp
    //used Collin-Davis's held karp
    function tsp_hk(distance_matrix) {
        const numCities = distance_matrix.length; //num Cities = n  
        if (numCities <= 1) return 0; //Case for 0 or 1
        
        const memo = new Map();
    
        //Helper function to find shortest distance with Help-Karp
        //FST = Find Shortest Tour  
        //'visitedCities' is used as a bitmask where it shows if it is visited (1) or not visited (0)
        //'currentCity' is the current city that is being processed
        function FST(visitedCities, currentCity) { 
            const citiesKey = `${visitedCities}-${currentCity}`; // Key to store the subset result 
    
            //Check if subset has been solved
            if (memo.has(citiesKey)) {
                return memo.get(citiesKey);
            }
    
            //Base case: If all cities have been visited. return distance to last.
            //'visitedCities === (1 << numCities) - 1' means all bits are set (all cities have been visited) 
            if (visitedCities === (1 << numCities) - 1) { 
                return distance_matrix[currentCity][numCities - 1] || 0; // return 0 if no connection exists
            } 
    
            let minCost = Infinity; 
    
            //Recursive case: explore next cities
            for (let nextCity = 0; nextCity < numCities; nextCity++) { 
                //If city has not been visited
                if (!(visitedCities & (1 << nextCity))) {
                    //Add 'nextCity' to the visited set by setting it with a corresponding bit. 
                    const remainingCities = visitedCities | (1 << nextCity); 
                    //Will calculate the cost of the visiting 'nextCity' and continue the search 
                    const cost = distance_matrix[currentCity][nextCity] + FST(remainingCities, nextCity); 
                    minCost = Math.min(minCost, cost);
                }
            }
    
            //Store the result in the memoization table. 
            memo.set(citiesKey, minCost);
            return minCost; 
        }
    
        //MTL = Minimum Tour Length
        let MTL = Infinity; 
        //Calculate the minimum tour length
        for (let startCity = 0; startCity < numCities; startCity++) {
            //Start with only 'startCity' visited (bitmask '1 << startCity') 
            MTL = Math.min(MTL, FST(1 << startCity, startCity)); 
        }
    
        return MTL; 
    }