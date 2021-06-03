import Search from './models/Search';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import { elements, renderLoader, clearLoader } from './views/base';
import Recipe from './models/Recipe';
import List from './models/List';
import * as listView from './views/listView';
import Likes from './models/Likes';
import * as likesView from './views/likesView';


/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {

};
// window.state = state;


// -----------------SEARCH CONTROLLER-----------------
const controlSearch = async() => {
	// 1)	Get Query From The View
    const query = searchView.getInput();
    // const query = 'pizza';
    if(query){
		// 2)	New Search Object and Add To State
        state.search = new Search(query);
        // 3)	Prepare UI For Result
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try{
        // 4)	Search For Recipe
            await state.search.getResult();
        // 5)	Render Result For UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }catch(err){
            alert('Something wrong with the search...');
            clearLoader();
        }
    }
}
    elements.searchForm.addEventListener('submit',e => {
    e.preventDefault();
    controlSearch();
});
// //testing
// window.addEventListener('load',e => {
//     e.preventDefault();
//     controlSearch();
// });

elements.searchResPages.addEventListener('click',e=> {
    const btn =e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result,goToPage);
    }
});

// ----------------RECIPE CONTROLLER------------------
const controlRecipe = async () => {
    //Get ID from url
    const id = window.location.hash.replace('#','');
    console.log(id);
    if(id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        //Highlight selected search item
        if(state.search) searchView.highlightSelected(id);
        //Create new recipe object
        state.recipe = new Recipe(id);
        // testing
        // window.r = state.recipe;
        try{
            //Get recipe data and parseIngr
            await state.recipe.getRecipe();
            console.log(state.recipe.ingredients);
            state.recipe.parseIngredients();
            //calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //Render recipe
           clearLoader();
           recipeView.renderRecipe(
               state.recipe,
               state.likes.isLiked(id)
               );

        }catch (err){
            console.log(err);
            alert(`Error processing recipe`);
        }
    }
};
// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load',controlRecipe);
['hashchange','load'].forEach(event => window.addEventListener(event, controlRecipe));

// ----------List Controller----------------
const controlList = () => {
 // Create a new list IF there in none yet
    if(!state.list) state.list = new List();
// Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);
    });
}

//handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    //handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        state.list.deleteItem(id);
        //delete from UI
        listView.deleteItem(id);
        //handle the count update
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});
// ---------------like controller--------------
//testing
// state.likes = new Likes();
// likesView.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //user has not yet liked current recipe
    if(!state.likes.isLiked(currentID)){
        //add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle the like button
        likesView.toggleLikeBtn(true);
        //add like to UI list
        likesView.renderLike(newLike);
        console.log(state.likes);
    //user has  liked current recipe
    }else{
        //remove like from the state
        state.likes.deleteLike(currentID);
        //toggle the like button
        likesView.toggleLikeBtn(false);
        //remove like to UI list
        likesView.deleteLike(currentID);
        console.log(state.likes);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//restore liked recipe on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    //restore likes
    state.likes.readStorage();
    //toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    //render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});
 

//handle recipe button clicks
elements.recipe.addEventListener('click',e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease button is clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //add ingredients to shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        //like controller
        controlLike();
    }
    console.log(state.recipe);
});

