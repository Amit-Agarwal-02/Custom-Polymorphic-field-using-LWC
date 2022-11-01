/****
    @description       :
    @author            : Amit Agarwal
    @group             :
    @last modified on  : 
    @last modified by  : Amit Agarwal
****/
public with sharing class PolymorphicLookupObjects {
    public PolymorphicLookupObjects() {

    }
    @AuraEnabled(cacheable=true)
    public static List<sObject> getObjectLookupList(){
        String Query = '';
        Query  = 'SELECT Id, IsCreateNewRecordAllowed__c,sObjectAPIName__c, sObjectLabel__c, sObjectPluralName__c, sObjectRecords_Search_by_field__c, sObjectLookup_subtitle_field__c, sObject_Display_IconName__c FROM PolymorphicLookupObject__mdt '; 
        List<SObject> sObjectList = Database.query(Query);
        return sObjectList;
    }
}