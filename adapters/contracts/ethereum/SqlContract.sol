// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SQLContract {
    struct Record {
        string[] fields;
        string[] values;
    }

    mapping(string => Record[]) private tables;

    /**
     * Insert a record into a table.
     * @param table Table name
     * @param fields Comma-separated field names
     * @param values Comma-separated values
     */
    function insertRecord(
        string memory table,
        string[] memory fields,
        string[] memory values
    ) public {
        require(
            fields.length == values.length,
            "Fields and values length mismatch"
        );
        Record memory record = Record(fields, values);
        tables[table].push(record);
    }

    /**
     * Select records matching criteria.
     * @param table Table name
     * @param field Field to filter
     * @param value Value to filter
     * @return results Matching records
     */
    function selectRecords(
        string memory table,
        string memory field,
        string memory value
    ) public view returns (Record[] memory) {
        Record[] memory allRecords = tables[table];
        uint256 count = 0;

        for (uint256 i = 0; i < allRecords.length; i++) {
            for (uint256 j = 0; j < allRecords[i].fields.length; j++) {
                if (
                    keccak256(bytes(allRecords[i].fields[j])) ==
                    keccak256(bytes(field)) &&
                    keccak256(bytes(allRecords[i].values[j])) ==
                    keccak256(bytes(value))
                ) {
                    count++;
                }
            }
        }

        Record[] memory results = new Record[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < allRecords.length; i++) {
            for (uint256 j = 0; j < allRecords[i].fields.length; j++) {
                if (
                    keccak256(bytes(allRecords[i].fields[j])) ==
                    keccak256(bytes(field)) &&
                    keccak256(bytes(allRecords[i].values[j])) ==
                    keccak256(bytes(value))
                ) {
                    results[index] = allRecords[i];
                    index++;
                }
            }
        }

        return results;
    }

    /**
     * Update records matching criteria.
     * @param table Table name
     * @param field Field to update
     * @param newValue New value
     * @param filterField Field to filter
     * @param filterValue Value to filter
     */
    function updateRecords(
        string memory table,
        string memory field,
        string memory newValue,
        string memory filterField,
        string memory filterValue
    ) public {
        Record[] storage allRecords = tables[table];

        for (uint256 i = 0; i < allRecords.length; i++) {
            for (uint256 j = 0; j < allRecords[i].fields.length; j++) {
                if (
                    keccak256(bytes(allRecords[i].fields[j])) ==
                    keccak256(bytes(filterField)) &&
                    keccak256(bytes(allRecords[i].values[j])) ==
                    keccak256(bytes(filterValue))
                ) {
                    for (uint256 k = 0; k < allRecords[i].fields.length; k++) {
                        if (
                            keccak256(bytes(allRecords[i].fields[k])) ==
                            keccak256(bytes(field))
                        ) {
                            allRecords[i].values[k] = newValue;
                        }
                    }
                }
            }
        }
    }

    /**
     * Delete records matching criteria.
     * @param table Table name
     * @param filterField Field to filter
     * @param filterValue Value to filter
     */
    function deleteRecords(
        string memory table,
        string memory filterField,
        string memory filterValue
    ) public {
        Record[] storage allRecords = tables[table];
        for (uint256 i = 0; i < allRecords.length; i++) {
            for (uint256 j = 0; j < allRecords[i].fields.length; j++) {
                if (
                    keccak256(bytes(allRecords[i].fields[j])) ==
                    keccak256(bytes(filterField)) &&
                    keccak256(bytes(allRecords[i].values[j])) ==
                    keccak256(bytes(filterValue))
                ) {
                    delete allRecords[i];
                }
            }
        }
    }
}
