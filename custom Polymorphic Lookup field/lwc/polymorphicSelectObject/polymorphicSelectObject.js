import { LightningElement,api,wire } from 'lwc';
import getObjectLookupList from '@salesforce/apex/PolymorphicLookupObjects.getObjectLookupList';
const DELAY = 100;
export default class PolymorphicSelectObject extends LightningElement {

    openObjectList= false;
    hasInputfocus = false;
    blurTimeout;
    @api selectedObject={};
    @api objectList=[];

   // This is a wire method to fetch the List of Objects to be diaplyed on UI as options to select
    @wire(getObjectLookupList)
    wiredRecords({data,error}){
            if(data) {
                console.log("data wiredRecords => " + JSON.stringify(data));
                let items = [];
               // loop over each record and make a wrapper class
                data.forEach(ele => {
                    let item = {};
                    item.APIName = ele.sObjectAPIName__c;
                    item.LabelName = ele.sObjectLabel__c;
                    item.searchTitle = ele.sObjectRecords_Search_by_field__c;
                    item.subtitleFields = ele.sObjectLookup_subtitle_field__c;
                    item.iconName = ele.sObject_Display_IconName__c;
                    item.createRecord = ele.IsCreateNewRecordAllowed__c;
                  items.push(item);
                });

                // store the items in objectList variable
                this.objectList = items;

                // store the default selected Object as the first object from the list
                this.selectedObject = this.objectList[0];

                console.log("selectedObject wiredRecords => " + JSON.stringify(this.selectedObject));

                //fire an event on object selection
                // to pass the selected object to parent component
                this.fireselectedObjectEvent();
                this.errors = undefined;
            }
            if(error) {
                console.log("error wiredRecords => " +  JSON.stringify(error));
                this.objectList = undefined;
                this.errors = error;
            };
    }

    // toggle the dropdown list onclick of dropdown icon
    handleObjListToSelect() {
        this.openObjectList = !this.openObjectList;
    }

    // remove/hide the dropdown options on blur
    handleInputRecordBlur() {
        this.blurTimeout = window.setTimeout(() => {
            this.hasInputfocus = false;
            this.openObjectList = false;
            this.blurTimeout = null;
        },
            DELAY
        );
    }

    handleObjectSelection(event) {        
        let apiname = event.currentTarget.dataset.objapiname;
        this.openObjectList = false;
        let objectFound = this.objectList.find(function (ele, index) {
            if (ele.APIName === apiname)
                return true;
        });
        this.selectedObject = objectFound;

        //fire an event on object selection
        this.fireselectedObjectEvent();        
    }

    //fire an event on object selection
    // to pass the selected object to parent component
    fireselectedObjectEvent(){
        const selectedObjectEvent = new CustomEvent('selectionchange',{
            detail:{
                selectedObject: this.selectedObject
            }
        });
        this.dispatchEvent(selectedObjectEvent);
    }

    // remove/hide the dropdown options on blur
    get getDropDownClass() {
        let css = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
        return this.openObjectList ? css + 'slds-is-open' : css;
    }
}