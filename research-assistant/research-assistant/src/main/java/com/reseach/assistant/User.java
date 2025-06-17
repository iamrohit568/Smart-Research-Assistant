//package com.reseach.assistant;
//
//
//import jakarta.persistence.Id;
//import jakarta.persistence.Table;
//import lombok.Data;
//import jakarta.persistence.Entity;
//
//@Entity(name="research_assistant")
//@Data
//@Table
//public class User {
//
//    @Id
//    int id;
//
//    String name;
//}
//
//
//


package com.reseach.assistant;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;
}