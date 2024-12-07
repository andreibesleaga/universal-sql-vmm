// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SQLHederaContract {
    struct Record {
        string[] fields;
        string[] values;
    }

    mapping(string => Record[]) private tables;

    /**
     * Insert a record into a table.
     * @param table Table name
     * @param fields Array of field names
     * @param values Array of values corresponding to the fields
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
     * Select records matching a field and value.
     * @param table Table name
     * @param field Field to filter
     * @param value Value to filter
     * @return results Matching records
     */
    function selectRecord(
        string memory table,
        string memory field,
        string memory value
    ) public view returns (Record[] memory results) {
        uint256 count = 0;
        for (uint256 i = 0; i < tables[table].length; i++) {
            for (uint256 j = 0; j < tables[table][i].fields.length; j++) {
                if (
                    keccak256(abi.encodePacked(tables[table][i].fields[j])) ==
                    keccak256(abi.encodePacked(field)) &&
                    keccak256(abi.encodePacked(tables[table][i].values[j])) ==
                    keccak256(abi.encodePacked(value))
                ) {
                    count++;
                }
            }
        }

        results = new Record[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < tables[table].length; i++) {
            for (uint256 j = 0; j < tables[table][i].fields.length; j++) {
                if (
                    keccak256(abi.encodePacked(tables[table][i].fields[j])) ==
                    keccak256(abi.encodePacked(field)) &&
                    keccak256(abi.encodePacked(tables[table][i].values[j])) ==
                    keccak256(abi.encodePacked(value))
                ) {
                    results[index] = tables[table][i];
                    index++;
                }
            }
        }
    }

    /**
     * Update records matching criteria.
     * @param table Table name
     * @param field Field to update
     * @param newValue New value for the field
     * @param filterField Field to filter by
     * @param filterValue Value to filter by
     */
    function updateRecord(
        string memory table,
        string memory field,
        string memory newValue,
        string memory filterField,
        string memory filterValue
    ) public {
        for (uint256 i = 0; i < tables[table].length; i++) {
            for (uint256 j = 0; j < tables[table][i].fields.length; j++) {
                if (
                    keccak256(abi.encodePacked(tables[table][i].fields[j])) ==
                    keccak256(abi.encodePacked(filterField)) &&
                    keccak256(abi.encodePacked(tables[table][i].values[j])) ==
                    keccak256(abi.encodePacked(filterValue))
                ) {
                    for (
                        uint256 k = 0;
                        k < tables[table][i].fields.length;
                        k++
                    ) {
                        if (
                            keccak256(
                                abi.encodePacked(tables[table][i].fields[k])
                            ) == keccak256(abi.encodePacked(field))
                        ) {
                            tables[table][i].values[k] = newValue;
                        }
                    }
                }
            }
        }
    }

    /**
     * Delete records matching criteria.
     * @param table Table name
     * @param filterField Field to filter by
     * @param filterValue Value to filter by
     */
    function deleteRecord(
        string memory table,
        string memory filterField,
        string memory filterValue
    ) public {
        uint256 i = 0;
        while (i < tables[table].length) {
            bool matchFound = false;
            for (uint256 j = 0; j < tables[table][i].fields.length; j++) {
                if (
                    keccak256(abi.encodePacked(tables[table][i].fields[j])) ==
                    keccak256(abi.encodePacked(filterField)) &&
                    keccak256(abi.encodePacked(tables[table][i].values[j])) ==
                    keccak256(abi.encodePacked(filterValue))
                ) {
                    matchFound = true;
                    break;
                }
            }
            if (matchFound) {
                tables[table][i] = tables[table][tables[table].length - 1];
                tables[table].pop();
            } else {
                i++;
            }
        }
    }
}
