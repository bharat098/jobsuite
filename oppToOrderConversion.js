//Importing
import { LightningElement,wire,api,track } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { getRecord,updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ORDER_OBJECT from '@salesforce/schema/Order';
//Imported From Apex Class
import Convert from '@salesforce/apex/OppToOrderConversion.Convert';
import getStageName from '@salesforce/apex/OppToOrderConversion.getStageName';
import getOppLineItem from '@salesforce/apex/OppToOrderConversion.getOppLineItem';
import getContracts from '@salesforce/apex/OppToOrderConversion.getContracts';
import getOrderStatus from '@salesforce/apex/orderSettingController.getOrderStatus';
//Imported From Labels
import alreadyConverted from '@salesforce/label/c.Already_Converted';
import StageMessage from '@salesforce/label/c.Stage_Message';
import LineItemnotAvalible from '@salesforce/label/c.LineItemnotAvalible';
import Empty_Contract from '@salesforce/label/c.Empty_Contract';
import Mandatory_Mapping_in_o2o_mapping_page from '@salesforce/label/c.Mandatory_Mapping_in_o2o_mapping_page';
import Mapped_Fields_Empty from '@salesforce/label/c.Mapped_Fields_Empty';
import Invalid_Status from '@salesforce/label/c.Invalid_Status';
import ACTIVATED_ORDER_STATUS_ERROR from '@salesforce/label/c.ACTIVATED_ORDER_STATUS_ERROR';
import GeoLocation_Error from '@salesforce/label/c.GeoLocation_Error';
import Bad_Value_Error from '@salesforce/label/c.Bad_Value_Error';
import Opportunity_converted_Successfully from '@salesforce/label/c.Opportunity_converted_Successfully';
import Error_During_Convert from '@salesforce/label/c.Error_During_Convert';
import Required_Field_Updated_Successfully from '@salesforce/label/c.Required_Field_Updated_Successfully';
import Account_required from '@salesforce/label/c.Account_required';
import Opportunity_Name from '@salesforce/label/c.Opportunity_Name';
import Account_Name from '@salesforce/label/c.Account_Name';
import Add_Contract from '@salesforce/label/c.Add_Contract';
import Select_contract from '@salesforce/label/c.Select_contract';
import Cancel from '@salesforce/label/c.Cancel';
import Convertion from '@salesforce/label/c.Convert';
import Developed_By from '@salesforce/label/c.Developed_By';
import Dhruvsoft_Consulting_partner from '@salesforce/label/c.Dhruvsoft_Consulting_partner';
import Dhruvsoft_label from '@salesforce/label/c.Dhruvsoft_label';
import close from '@salesforce/label/c.close';
import Required_Fields from '@salesforce/label/c.Required_Fields';
import Save from '@salesforce/label/c.Save';
import Order_Field_Label from '@salesforce/label/c.Order_Field_Label';
import Order_Field_ApiName from '@salesforce/label/c.Order_Field_ApiName';
import order_Status_Picklist_Value_Error from '@salesforce/label/c.order_Status_Picklist_Value_Error';
import Order_StartDate from '@salesforce/label/c.Order_StartDate';
import Ord_Contract_inactive from '@salesforce/label/c.Ord_Contract_inactive';
import OrdSettingEmptyMsg from '@salesforce/label/c.OrdSettingEmptyMsg';
//Import fields
import ISCOV_FIELD from '@salesforce/schema/Opportunity.IsConverted1__c';
import Name_FIELD from '@salesforce/schema/Opportunity.Name';
import AccId_FIELD from '@salesforce/schema/Opportunity.AccountId';
import AccName_FIELD from '@salesforce/schema/Opportunity.Account.Name';


const FIELDS = [
    ISCOV_FIELD,
    AccName_FIELD,
    Name_FIELD,
    AccId_FIELD,
    
];
 
export default class OppToOrderConversion extends LightningElement {
    label = {
        alreadyConverted,
        LineItemnotAvalible,
        StageMessage,
        Empty_Contract,
        Mandatory_Mapping_in_o2o_mapping_page,
        Mapped_Fields_Empty,
        Invalid_Status,
        ACTIVATED_ORDER_STATUS_ERROR,
        GeoLocation_Error,
        Bad_Value_Error,
        Required_Field_Updated_Successfully,
        Opportunity_converted_Successfully,
        Error_During_Convert,
        Account_required,
        Opportunity_Name,
        Account_Name,
        Add_Contract,
        Select_contract,
        Cancel,
        Convertion,
        Developed_By,
        Dhruvsoft_Consulting_partner,
        Dhruvsoft_label,
        close,
        Required_Fields,
        Save,
        Order_Field_Label,
        Order_Field_ApiName,
        order_Status_Picklist_Value_Error,
        Order_StartDate,
        Ord_Contract_inactive,
        OrdSettingEmptyMsg

    };
    @api recordId;
    @api objectApiName;
    @track  orderId;
    relatedAccName;
    relatedAccUrl;
    accId;
    opptyName;
    opptyUrl;
    ordUrlLink;
    @track opptyIsConverted;
    opportunity;
    @track contractPicklistValues;
    @track contracts;
    allowSave = false;
    contractSelectedValue;
    @track isContractVisible = false;
    LineItemnotAvalible = false;
    stageNotClosed = false;
    @track getOppLineItem;
    @track getStageName;
    errorOLIActivities; 
    errorGetStageActivities;
    @track error;
    isOppFieldsRequired = false;
    @track oppRequiredFields = [];
    @track oppFieldAPILabelMap;
    @track ordFieldAPILabelMap;
    @track unMappedRequiredFields = [];
    showUnMappedRequired = false;
    showMappedRequired = false;
    @track isOrdSettingEmpty = false;

    @wire(getOrderStatus) orderStatusData ({ error, data }) {
        if (data) {
             this.isOrdSettingEmpty = true;
       } else if (error) { 
           this.error = error; 
      }   }
    refresh(event){
        this.isContractVisible = false;
        this.refreshAgain();
        return refreshApex(this.errorGetStageActivities);
    }
    refreshAgain(event){
        return refreshApex(this.errorOLIActivities); 
    }
   

    @wire(getObjectInfo, { objectApiName: OPPORTUNITY_OBJECT })
    oppInfo({ data, error }) {
        if(data){

            let tempMap = [];
            for(let fData in data.fields){
                let fDetails = data.fields[fData];
                tempMap.push({value:fDetails['label'], key:fDetails['apiName']});
                this.oppFieldAPILabelMap = tempMap;
            }
        } 
    }

    @wire(getObjectInfo, { objectApiName: ORDER_OBJECT })
    orderInfo({ data, error }) {
        if(data){
            
            let tempMap = [];
            for(let fData in data.fields){ 
                let fDetails = data.fields[fData];
                tempMap.push({value:fDetails['label'], key:fDetails['apiName']});
                this.ordFieldAPILabelMap = tempMap;
            }
        } 
    }

    //Wire Method for getting the Opportunity line item
    @wire(getOppLineItem,{opportunityRecId:'$recordId'})
    getOppLineItem(value){
    this.errorOLIActivities = value;
    const { data, error } = value;
        if (data) {

            if(data =='No-oli-Found'){
                this.LineItemnotAvalible = true;
            }else if(data =='oli-Found'){
                this.LineItemnotAvalible = false;
            }
            this.refreshAgain();

        }else if(error){
            this.error = error;
        }
    }

    //Wire Method for getting the stage Name of Opportunity 
    @wire(getStageName,{opportunityRecId:'$recordId'}) 
    getStageName(value){
        this.errorGetStageActivities = value;
        const { data, error } = value;
        if(data){
            if(data =='Closed-Won'){
                this.stageNotClosed = false;
            }else {
                this.stageNotClosed = true;
                
            }
            this.refresh();
        }else if(error){
             this.error = error;
        }
    }


    
    //Wire Method for getting the details
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    opportunity(result){
        this.opportunity = result;
        if (result.data) {
        
            try {
               
                let opptyName = result.data.fields.Name.value;
                let opptyId =  result.data.id;
                let opptyIsConverted = result.data.fields.IsConverted1__c.value;
                if(result.data.fields.Account.value != null){
                    let accName = result.data.fields.Account.value.fields.Name.value;
                    let accId =  result.data.fields.AccountId.value;
                    this.accId = accId;
                    let accUrl = 'https://'+location.host+'/'+accId;
                    this.relatedAccName = accName;
                    this.relatedAccUrl = accUrl;
                }
                let oppUrl = 'https://' + location.host + '/' + opptyId;
                this.opptyName = opptyName;
                this.opptyUrl = oppUrl;
                this.opptyIsConverted = opptyIsConverted;
                //this.refreshAgain();
            
            } catch (error) {
            }
            
        }

    }

    //handleActiveCheckBox
    handleActiveCheckBox(event){
        this.isContractVisible = event.target.checked;
    }

    //Show Contract picklist
    @wire(getContracts, { accId: '$accId' })
    contractList(data ,error){ 
        if (data) {
            
            try {
               
                let options = [];
                var conts = data.data;
                for (var key in conts) {
                    // Here key will have index of list of records starting from 0,1,2,....
                    options.push({label: conts[key].ContractNumber, value:conts[key].Id});
                    // Here Name and Id are fields from sObject list.
                }
                this.contractPicklistValues = options;
               
                 
            } catch (error) {
            }
        } else if (error) {
        }
    }

    handelContractChange(event){
        this.contractSelectedValue = event.target.value; 
    }


    //Close Modal
    closeModal() {
        this.dispatchEvent(new CloseActionScreenEvent());  
        this.refreshAgain();
    }
    
    //Conversion
    handelConvert(event) {
        this.refreshAgain();
        if(this.isOrdSettingEmpty == true){
            if(this.opptyIsConverted == false){
                if(this.isContractVisible == true &&  this.contractSelectedValue== null){
                    const evt = new ShowToastEvent({
                        title: 'Error',
                        message: this.label.Empty_Contract,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    
                } else {
                    
                    if (this.relatedAccName != null) {
                        
                    Convert({oppId: this.recordId, conId: this.contractSelectedValue})
                        .then(result => {
                        

                        let ordId =  result.orderId;

                        if(result.errorType == 'Required_ERROR'){
                            this.isOppFieldsRequired = true;
                            if(result.unMappedRequiredFieldsList.length>0){
                                let tempList = [];
                                for(let fName of result.unMappedRequiredFieldsList){
                                    let unMappedOrdRecord = this.ordFieldAPILabelMap.filter(function (fMap) {
                                        return (fMap.key).toLowerCase() === fName;
                                    });
                                    if(unMappedOrdRecord != undefined && unMappedOrdRecord.length > 0 ){
                                        let umMappedObj = {};
                                        umMappedObj.fieldName = unMappedOrdRecord[0].key;
                                        umMappedObj.fieldLabel = unMappedOrdRecord[0].value;
                                        tempList.push(umMappedObj);
                                    }
                                }
                                if(tempList.length>0){
                                    this.unMappedRequiredFields = tempList;
                                    this.showUnMappedRequired = true;
                                    const evt = new ShowToastEvent({
                                        title: 'Map Required Fields on Order',
                                        message: this.label.Mandatory_Mapping_in_o2o_mapping_page,
                                        variant: 'warning',
                                        mode: 'sticky'
                                    });
                                    this.dispatchEvent(evt);
                                }
                            }
                            if(result.mappedRequiredFieldsList.length>0){
 
                                let tempList = [];

                                for(let fName of result.mappedRequiredFieldsList){

                                    let mappedRequiredRecord = this.oppFieldAPILabelMap.filter(function (fMap) {
                                        return (fMap.key).toLowerCase() === fName;
                                    });

                                    if(mappedRequiredRecord != undefined && mappedRequiredRecord.length > 0 ){
                                        let mappedObj = {};
                                        mappedObj.fieldName = mappedRequiredRecord[0].key;
                                        mappedObj.fieldLabel = mappedRequiredRecord[0].value;
                                        tempList.push(mappedObj);
                                    }
                                }
                                if(tempList.length > 0){
                                    this.oppRequiredFields = tempList;
                                    this.showMappedRequired = true;
                                    const evt = new ShowToastEvent({
                                        title: 'Mapped Fields should not blank',
                                        message: this.label.Mapped_Fields_Empty,
                                        variant: 'warning',
                                        mode: 'sticky'
                                    });
                                    this.dispatchEvent(evt);
                                }
                            }
                        }else if(result.errorType == 'INVALID_STATUS'){
                            const evt = new ShowToastEvent({
                                title: 'Invalid Status',
                                message: this.label.Invalid_Status,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.errorType == 'ACTIVATED_ORDER_STATUS_ERROR'){
                            const evt = new ShowToastEvent({
                                title: 'Activated Order Status Error',
                                message: this.label.order_Status_Picklist_Value_Error,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.errorType == 'ORDERSTARTDATE_CANTBE_EARLIER'){
                            const evt = new ShowToastEvent({
                                title: 'ORDER START DATE CANT BE EARLIER',
                                message: this.label.Order_StartDate,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.errorType == 'GEOLOCATION_ERROR'){
                            const evt = new ShowToastEvent({
                                title: 'GeoLocation Error',
                                message: this.label.GeoLocation_Error,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.errorType == 'ORDER_CONTRACT_CANTBE_INACTIVE'){
                            const evt = new ShowToastEvent({
                                title: 'ORDER CONTRACT CANT BE INACTIVE',
                                message: this.label.Ord_Contract_inactive,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                            
                        }else if(result.errorType == 'BADVALUE_ERROR'){
                            const evt = new ShowToastEvent({
                                title: 'Bad Value Error',
                                message: this.label.Bad_Value_Error,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.isSuccess == true){
                            let ordUrl = 'https://' + location.host + '/' + ordId; 
                            this.ordUrlLink = ordUrl;
                            this.dispatchEvent(new CloseActionScreenEvent()); 
                            const event = new ShowToastEvent({
                                title: 'Success!',
                                message: this.label.Opportunity_converted_Successfully +'{1}' ,
                                variant: 'success',
                                mode : "dismissable",
                                duration : 1000,
                                messageData: [
                                    'Order ',
                                    {
                                        url: this.ordUrlLink,
                                        label: 'Click Here',
                                    },
                                ],
                            });
                            this.dispatchEvent(event);
                            this.opptyIsConverted = true;
                            let fields = {};
                            let objRecordInput = {};
                            fields = {
                                'Id': this.recordId,
                                'IsConverted1__c':this.opptyIsConverted
                            };       

                            objRecordInput = { fields };
                            updateRecord(objRecordInput)
                            .then(() =>{
                                
                            })
                            .catch(error =>{

                                const evt = new ShowToastEvent({
                                    title: 'Error!',
                                    message: this.label.Error_During_Convert,
                                    variant: 'error',
                                    mode: 'sticky'
                                    
                                });
                                this.dispatchEvent(evt);
                                
                            })
                        }
                    })
                    .catch(error => {
                        this.error = error;
                    });
                
                }else{
                    const evt = new ShowToastEvent({
                        title: 'Error!',
                        message: this.label.Account_required,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                }
            }
            }else{
                if(this.isContractVisible == true &&  this.contractSelectedValue == null){
                    const evt = new ShowToastEvent({
                        title: 'Error',
                        message: this.label.Empty_Contract,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                }else{
                    if(this.relatedAccName !=null){
                    Convert({oppId: this.recordId, conId: this.contractSelectedValue})
                    .then(result => {

                        let ordId =  result.orderId;

                        if(result.errorType == 'Required_ERROR'){
                            this.isOppFieldsRequired = true;
                            if(result.unMappedRequiredFieldsList.length>0){
                                let tempList = [];
                                for(let fName of result.unMappedRequiredFieldsList){

                                    let unMappedOrdRecord = this.ordFieldAPILabelMap.filter(function (fMap) {
                                        return (fMap.key).toLowerCase() === fName;
                                    });

                                    if(unMappedOrdRecord != undefined && unMappedOrdRecord.length > 0 ){
                                        let umMappedObj = {};
                                        umMappedObj.fieldName = unMappedOrdRecord[0].key;
                                        umMappedObj.fieldLabel = unMappedOrdRecord[0].value;
                                        tempList.push(umMappedObj);
                                    }
                                }
                                if(tempList.length>0){
                                    this.unMappedRequiredFields = tempList;
                                    this.showUnMappedRequired = true;
                                    const evt = new ShowToastEvent({
                                        title: 'Map Required Fields on Order',
                                        message: this.label.Mandatory_Mapping_in_o2o_mapping_page,
                                        variant: 'warning',
                                        mode: 'sticky'
                                    });
                                    this.dispatchEvent(evt);
                                }
                            }
                            if(result.mappedRequiredFieldsList.length>0){
                                let tempList = [];

                                for(let fName of result.mappedRequiredFieldsList){
                                    let mappedRequiredRecord = this.oppFieldAPILabelMap.filter(function (fMap) {
                                        return (fMap.key).toLowerCase() === fName;
                                    });
                                    if(mappedRequiredRecord != undefined && mappedRequiredRecord.length > 0 ){
                                        let mappedObj = {};
                                        mappedObj.fieldName = mappedRequiredRecord[0].key;
                                        mappedObj.fieldLabel = mappedRequiredRecord[0].value;
                                        tempList.push(mappedObj);
                                    }
                                }
                                if(tempList.length > 0){
                                    this.oppRequiredFields = tempList;
                                    this.showMappedRequired = true;
                                    const evt = new ShowToastEvent({
                                        title: 'Mapped Fields should not blank',
                                        message: this.label.Mapped_Fields_Empty,
                                        variant: 'warning',
                                        mode: 'sticky'
                                    });
                                    this.dispatchEvent(evt);
                                }
                            }
                        }else if(result.errorType == 'INVALID_STATUS'){
                            const evt = new ShowToastEvent({
                                title: 'Invalid Status',
                                message: this.label.Invalid_Status,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.errorType == 'ACTIVATED_ORDER_STATUS_ERROR'){
                            const evt = new ShowToastEvent({
                                title: 'Activated Order Status Error',
                                message: this.label.order_Status_Picklist_Value_Error,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }else if(result.errorType == 'GEOLOCATION_ERROR'){
                            const evt = new ShowToastEvent({
                                title: 'GeoLocation Error',
                                message: this.label.GeoLocation_Error,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                        }
                        else if(result.errorType == 'ORDERSTARTDATE_CANTBE_EARLIER'){
                            const evt = new ShowToastEvent({
                                title: 'ORDER START DATE CANT BE EARLIER',
                                message: this.label.Order_StartDate,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                            
                        }else if(result.errorType == 'ORDER_CONTRACT_CANTBE_INACTIVE'){
                            const evt = new ShowToastEvent({
                                title: 'ORDER CONTRACT CANT BE INACTIVE',
                                message: this.label.Ord_Contract_inactive,
                                variant: 'warning',
                                mode: 'sticky'
                            });
                            this.dispatchEvent(evt);
                            
                        }else if(result.isSuccess == true){
                            let ordUrl = 'https://' + location.host + '/' + ordId; 
                            this.ordUrlLink = ordUrl
                            this.dispatchEvent(new CloseActionScreenEvent());
                            const event = new ShowToastEvent({
                                title: 'Success!',
                                message: this.label.Opportunity_converted_Successfully +'{1}' ,
                                variant: 'Success',
                                mode : "dismissable",
                              
                                messageData: [
                                    'Order ',
                                    {
                                        url: this.ordUrlLink,
                                        label: 'Click Here',
                                    },
                                ],
                            });
                            this.dispatchEvent(event);
                            this.opptyIsConverted = true;
                            let fields = {};
                            let objRecordInput = {};
                            fields = {
                                'Id': this.recordId,
                                'IsConverted1__c':this.opptyIsConverted
                            };       
                            objRecordInput = { fields };
                            updateRecord(objRecordInput)
                            .then(() =>{
                            })
                            .catch(error =>{
                                const evt = new ShowToastEvent({
                                    title: 'Error!',
                                    message: this.label.Error_During_Convert,
                                    variant: 'error',
                                    mode: 'sticky'
                                    
                                });
                                this.dispatchEvent(evt);
                                
                            })
                        }
                    })
                    .catch(error => {
                        this.error = error;
                    });
                }else{
                    const evt = new ShowToastEvent({
                        title: 'Error!',
                        message: this.label.Account_required,
                        variant: 'error',
                        mode: 'dismissable'
                        
                    });
                    this.dispatchEvent(evt);
                }
            }
            }
        }else{
            const evt = new ShowToastEvent({
                    title: 'Error',
                    message: this.label.OrdSettingEmptyMsg,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
        }
    }
    handleUpdate(event){
   
        this.template.querySelector('lightning-record-edit-form').forEach(element => {
            element.reportValidity();
        });
 }
    

    handleSuccess(e){
            this.isOppFieldsRequired = false;
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!',
                message: this.label.Required_Field_Updated_Successfully,
                variant: 'success'
            })
        )
        
    }
    handleError(e){
        this.template.querySelector('[data-id="message"]').setError(e.detail.detail);
        e.preventDefault();
    }
    validateFields() {
        return [...this.template.querySelectorAll("lightning-input-field")].reduce((validSoFar, field) => {
            return (validSoFar && field.reportValidity());
        }, true);
    }
    handleUnMapped(){
        this.isOppFieldsRequired = false;
        this.showUnMappedRequired = false;
    }

    handleMainErrorModal(){
        this.isOppFieldsRequired = false;
    }
}