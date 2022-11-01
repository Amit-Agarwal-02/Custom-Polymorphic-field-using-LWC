import { LightningElement,api,track,wire } from 'lwc';
import fetchLookupRecords from '@salesforce/apex/searchLooupResult.searchRecords';
const DELAY = 100;
const MINIMAL_SEARCH_TERM_LENGTH = -1;
export default class PolymorphicSearchRecords extends LightningElement {


    @api selectedObject;
    @api searchRecords;
    @api searchPlaceholder;
    @track searchTerm = '';
    selectedItem = [];
    recSelected;
    isRecordSelected = false;
    hasInputfocus = false;
    blurTimeout;    
    cleanSearchTerm;
    searchThrottingTimeout;

    // On load of the component this will fecth the records of the default selected Object
    connectedCallback() {
        // console.log('selectedObject in searchRecords '+JSON.stringify(this.selectedObject));
        if (this.selectedObject.APIName != null) {
            this.searchPlaceholder = 'Search ' + this.selectedObject.LabelName + '....';
            this.fetchsObjectRecords({
                searchTerm: '',
                selectedIds: null,
                sObjectName: this.selectedObject.APIName,
                filterCriteria: [],
                titleFields: this.selectedObject.searchTitle,
                subtitleFields: this.selectedObject.subtitleFields
            });
        }
    }

    // this will toggle and show if  'New Record' button should be visible or not
    get hasCreateAllowed(){
        if(this.selectedObject.createRecord === true)
            return true;
        else
            return false;   
    }


    // if search box has is focused
    handleInputRecordFocus() {
        this.hasInputfocus = true;
    }

    // if a record is selected or not from the search lookup dropdown box 
    hasSelection() {
        return this.selectedItem.length > 0;
    }

    // if a record is already selected or selection is allowed from the search lookup dropdown box 
    isSelectionAllowed() {
        return !this.hasSelection();
    }


    // remove/hide the dropdown options on blur
    handleInputRecordBlur() {
        this.blurTimeout = window.setTimeout(() => {
            this.hasInputfocus = false;
            this.blurTimeout = null;
        },
            DELAY
        );
    }

    //search and fetch the records of the selected object on focus or click of the search box
    updateSearchTerm(event) {
        //check if selection is allowed or not
        if (!this.isSelectionAllowed()) {
            return;
        }       
        //stores the current input values on search box
        this.searchTerm = event.target.value;
        const newCleansearchterm = event.target.value.trim().replace(/\*/g, '').toLowerCase();
        if (this.cleanSearchTerm === newCleansearchterm) {
            return;
        }
        this.cleanSearchTerm = newCleansearchterm;

        if (newCleansearchterm.length < MINIMAL_SEARCH_TERM_LENGTH) {
            this.searchRecords = [];
            return;
        }

        if (this.searchThrottingTimeout) {
            clearTimeout(this.searchThrottingTimeout);
        }


        // check if minimum character is entered and delay teh search a few miliseconds
        this.searchThrottingTimeout = setTimeout(() => {
            if (this.cleanSearchTerm.length > MINIMAL_SEARCH_TERM_LENGTH) {
                console.log("this.searchTerm Updated to  => " + this.searchTerm);
                this.fetchsObjectRecords({
                    searchTerm: this.searchTerm,
                    selectedIds: null,
                    sObjectName: this.selectedObject.APIName,
                    filterCriteria: [],
                    titleFields: this.selectedObject.searchTitle,
                    subtitleFields: this.selectedObject.subtitleFields
                });
            }
            this.searchThrottingTimeout = null;
        },
            DELAY
        );
    }

    //to fetch the records from apex class 
    fetchsObjectRecords(detail) {
        //console.log('detail fetchsObjectRecords => ' + JSON.stringify(detail));
        fetchLookupRecords(detail)
            .then(results => {
            //    console.log("results => " + results);
                let items = [];
                results.forEach(ele => {
                    let item={};
                    item.id = ele.id;
                    item.icon = this.selectedObject.iconName; 
                    item.title = ele.title;
                    item.subtitle = ele.subtitle;
                    items.push(item);
                });
                this.searchRecords = items;
            })
            .catch(error => {
                this.searchRecords = [];
                console.log('error => ' + (error));
                console.log('error => ' + JSON.stringify(error));
            });
    }
    
    // to remove the current selected record
    handleRemoveSelection(){
        this.selectedItem = [];
    }

    // on click of the record from teh search box dropdown
    handleResultClick(event){
        const recordId = event.currentTarget.dataset.recordid;
        this.selectedItem = this.searchRecords.filter(result => result.id === recordId);
        console.log('selectedItem  => ' + JSON.stringify(this.selectedItem) );
        if(this.selectedItem.length === 0){
            return;
        }
        if(this.selectedItem.length > 0){
            this.isRecordSelected=true;
            this.recSelected = this.selectedItem[0];
        }
        console.log(' this.isRecordSelected   => ' +  this.isRecordSelected );
        console.log(' this.recSelected   => ' +  JSON.stringify(this.recSelected) );
        this.searchTerm = '';
        this.dispatchEvent(new CustomEvent('selectionchange'));
    }

    // fire an event to parent component if a New Record is to be created
    handleNewRecordClick() {
        this.dispatchEvent(new CustomEvent('createnewrecord'));
    }


    // removing the current selected item/record
    removeSelectedRecord(){
        this.isRecordSelected=false;
        this.recSelected = '';
        this.selectedItem =[];
    }

    get getSearchIconClass(){
        let css = 'slds-input__icon slds-input__icon_right ' +  (!this.hasSelection() ? '' : 'slds-hide');
        return css;
   }

    get getClearSelectionButtonClass() {
        return 'slds-button slds-button_icon slds-input__icon slds-input__icon_right ' + (this.hasSelection() ? '' : 'slds-hide');
    }

    get getInputValue() {
        return this.searchTerm;
    }

    get searchObjectPlaceholder() {
        return this.searchPlaceholder;
    }

    get getInputRecordsDropdownclass() {
        let css = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
        return this.hasInputfocus ? css + 'slds-is-open' : css;
    }

    get getComboboxClass(){
        let css ='slds-combobox__form-element slds-input-has-icon ';
            css += (this.hasSelection()? 'slds-input-has-icon_left-right' : 'slds-input-has-icon_right');
        return css;
    }

    get getInputClass() {
        let css = 'slds-input slds-combobox__input';
        css += 'slds-has-focus';
        return this.hasInputfocus ? css + 'slds-has-focus' : css;
    }
}