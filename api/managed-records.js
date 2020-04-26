import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

const retrieve = ({ page = 1, colors = ["red", "brown", "blue", "yellow", "green"] } = {}) => {

    return new Promise(function (resolve, reject) {

        //Process pages of 10 items at a time. 
        const itemsPerPage = 10;
        let offset = calculateOffset(page, itemsPerPage);

        //Get data from the /records endpoint using the Fetch API.
        //Parameter query format: ?limit=2&offset=0&color[]=brown&color[]=green
        const endpoint = URI(window.path).search({ limit: itemsPerPage+1, offset: offset, "color[]": colors });

        fetch(endpoint.toString())
            .then(response => {
                if (response.status !== 200) {

                    console.log('Looks like there was a problem. Status Code: ' + response.status);

                    //try to recover the fetch, call default retrieve
                    //TODO: Improve the recover logic
                    window.path = "http://localhost:3000/records";
                    resolve(retrieve());
                    return;
                }
                response.json().then(data => {

                    const nextPageFirstElement = data[itemsPerPage];

                    //removing element of the next page
                    data = data.slice(0, itemsPerPage);

                    //Calculate previous and next pages
                    let prevPage = page - 1;
                    let nextPage = page + 1;

                    if (nextPageFirstElement == null) {
                        nextPage = null;
                    }

                    if (page == 1) {
                        prevPage = null;
                    }

                    //ids: An array containing the ids of all items returned from the request.
                    const ids = data.map(element => element.id);

                    //open: An array containing all of the items returned from the request that 
                    //have a disposition value of "open". A fourth key called isPrimary 
                    //indicating whether or not the item contains a primary color (red, blue, or yellow).
                    const open = data.filter(element => element.disposition == "open")
                        .map(element => hasPrimaryColor(element));

                    //closedPrimaryCount: The total number of items returned from the request 
                    //that have a disposition value of "closed" and contain a primary color.
                    const closedPrimaryCount = data.map(element => hasPrimaryColor(element))
                        .filter(element => element.disposition == "closed" && element.isPrimary == true)
                        .length;

                    resolve({
                        previousPage: prevPage,
                        nextPage: nextPage,
                        ids: ids,
                        open: open,
                        closedPrimaryCount: closedPrimaryCount,
                    });

                })
            })
            .catch((error) => {

                console.log(error);
                reject();

            });
    });

}

//Determine if the element has a primary color in the arribute color
const hasPrimaryColor = (element) => {

    const primaryColors = ["red", "blue", "yellow"]

    if (primaryColors.includes(element.color)) {
        element.isPrimary = true;
    }
    else {
        element.isPrimary = false;
    }

    return element;
}

//Calculate offset and define the number of items per page
const calculateOffset = (page, itemsPerPage) => {

    if (page < 1) {
        reject(Error("Pages start at 1"));
    }
    if (page > 1) {
        return (page - 1) * itemsPerPage;
    }
    return 0;
} 


export default retrieve;
