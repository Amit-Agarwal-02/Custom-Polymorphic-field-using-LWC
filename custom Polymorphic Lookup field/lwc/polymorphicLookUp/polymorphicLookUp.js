import { LightningElement, track, api, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchLookupRecords from '@salesforce/apex/searchLooupResult.searchRecords';
export default class PolymorphicLookUp extends LightningElement {

    @track searchTerm = '';
    sObjectRecords = [];
    searchPlaceholder;
    selectedObject = {};
    isError=false;
    record;
    mainRecord;
    openCreateRecord;
    selectRecordType;
    recordTypeOptions;
    recordTypeId;
    error;

    //this holds the selected object
    handleObjectSelection(event) {
        this.selectedObject = event.detail.selectedObject;
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

    //this is used to fetch the lokup records of the selected object
    fetchsObjectRecords(detail) {
        console.log('detail this.selectedObject => ' + JSON.stringify(this.selectedObject));
        console.log('detail fetchsObjectRecords => ' + JSON.stringify(detail));
        fetchLookupRecords(detail)
            .then(results => {
                console.log("results => " + results);
                let items = [];
                results.forEach(ele => {
                    let item = {};
                    item.id = ele.id;
                    item.icon = this.selectedObject.iconName;
                    item.title = ele.title;
                    item.subtitle = ele.subtitle;
                    items.push(item);
                });
                this.sObjectRecords = items;
            })
            .catch(error => {
                this.sObjectRecords = [];
                console.log('error => ' + error);
                console.log('error => ' + JSON.stringify(error));
            });
    }

    // placeholder of search box
    get searchObjectPlaceholder() {
        return this.searchPlaceholder;
    }

    //to show error
    get errorStatus() {
        return this.isError;
    }


    //Used to get the object information of the selected object to create New record
    @wire(getObjectInfo, { objectApiName: '$selectedObject.APIName' })
    wiredObjectInfo({ error, data }) {
        if (data) {
            this.record = data;
            console.log("getObjectInfo this.record ", this.record);
            this.error = undefined;
            this.getRecordTypeOptions();
        } else if (error) {
            this.error = error;
            this.record = undefined;
            console.log("this.error", this.error);
        }
    }

    //Get the all record Types for the selected Object 
    getRecordTypeOptions() {
        let recordTypeInfos = Object.entries(this.record.recordTypeInfos);
        console.log("recordTypeInfos length", recordTypeInfos.length);
        if (recordTypeInfos.length > 1) {
            let temp = [];
            recordTypeInfos.forEach(([key, value]) => {
                console.log(key);
                if (value.available === true && value.master !== true) {
                    temp.push({ "label": value.name, "value": value.recordTypeId });
                }
            });
            this.recordTypeOptions = temp;
            console.log("recordTypeOptions", this.recordTypeOptions);
        } else {
            this.recordTypeId = this.record.defaultRecordTypeId;
        }
        console.log("recordTypeOptions", this.recordTypeOptions);
    }

    // handles the chnage of the recordtype selection
    handleRecordTypeChange(event) {
        console.log("In handleRecTypeChange", event.target.value);
        this.recordTypeId = event.target.value;
    }

    // open modal pop up to show recordtype optons to select for the selected object
    handleNewRecordCreation() {
        console.log(" this.recordTypeId ", this.recordTypeId);
        if (this.recordTypeOptions !== undefined && this.recordTypeOptions.length > 0) {
            this.recordTypeId = '';
            this.selectRecordType = true;
            this.openCreateRecord = false;
        } else {
            this.handleNext();
        }
    }

    // open modal pop up to create new records
    handleNext() {
        console.log(" this.recordTypeId ", this.recordTypeId);
        if (this.recordTypeId !== '') {
            this.selectRecordType = false;
            this.openCreateRecord = true;
        } else 
            this.isError = true;
    }

    handleSubmit() {
        this.template.querySelector('lightning-record-form').submit();
        this.isError = false;
    }

    handleSuccess(event) {
        this.selectRecordType = false;
        this.openCreateRecord = false;
        this.isError = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: `Record saved successfully with id: ${event.detail.id}`,
                variant: 'success',
            }),
        )
    }

    handleError() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Error saving the record',
                variant: 'error',
            }),
        )
    }

    closeModal() {
        this.isError = false;
        this.recordTypeOptions = '';
        this.recordTypeId = '';
        this.selectRecordType = false;
        this.openCreateRecord = false;
    }
}