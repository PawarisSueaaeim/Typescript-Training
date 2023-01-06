// Class projects state management
class ProjectState {
    private listeners: any[] = [];
    private projects: any[] = [];
    private static instance = new ProjectState();

    private constructor() {

    };

    static getInstance() {
        if (this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: any) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, numberOfPeople: number) {
        const newProjects = {
            id: Math.random().toString(),
            title: title,
            description: description,
            people: numberOfPeople
        };
        this.projects.push(newProjects);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

interface Validateable {
    value: string | number ,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
}

function validate( validateableInput: Validateable) {
    let isValid = true;
    if (validateableInput.required) {
        isValid = isValid && validateableInput.value.toString().trim().length !== 0;
    }
    if ( validateableInput.minLength != null && typeof validateableInput.value === 'string' ){
        isValid = isValid && validateableInput.value.length >= validateableInput.minLength;
    }
    if (validateableInput.maxLength != null && typeof validateableInput.value === 'string' ){
        isValid = isValid && validateableInput.value.length <= validateableInput.maxLength;
    }
    if (validateableInput.min != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value >= validateableInput.min;
    }
    if (validateableInput.max != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value <= validateableInput.max;
    }
    return isValid;
}

function autobind(_: any ,_2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor:PropertyDescriptor = {
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    }
    return adjDescriptor;
};

// ProjectList Class
class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProjects: any[];

    constructor(private type: 'active' | 'finished'){
        this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;
        this.assignedProjects = [];

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as HTMLElement;
        this.element.id = `${this.type}-projects`;

        this.renderContent();
        this.attach();

        projectState.addListener((project: any[]) => {
            this.assignedProjects = project;
            this.renderProjects();
        })
    }

    private renderContent () {
        const listId =  `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS';
    }

    private renderProjects () {
        const listEl =  document.getElementById(`${this.type}-project-list`)! as HTMLUListElement;;
        for (const prjItem of this.assignedProjects) {
            const listItem = document.createElement('li');
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem);
        }
    }

    private attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element)
    }
}

// ProjectInput class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input';

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.config();
        this.attach();

    }

    // ส่วนของการ Input ข้อมูล 
    private getherUserInput (): [string, string, number] | undefined { // ประกาศ function ชื่อว่า getherUserInput รับค่า 3 ชนิด
        const enteredTitle = this.titleInputElement.value;  // สร้างตัวแปรเพื่อรับค่าของ input ของ titleInputElement
        const enteredDescription = this.descriptionInputElement.value; // สร้างตัวแปรเพื่อรับค่า input ของ descriptionInputElement
        const enteredPeople = this.peopleInputElement.value; // สร้างตัวแปรเพื่อรับค่า input ของ peopleInputElement

        const titleValidate: Validateable = { // สร้างตัวแปร titleValidate เพื่อเก็บค่า value, required, minLength เพื่อเอาไปตรวจสอบ
            value: enteredTitle,  // จับตัวแปร enteredTitle ยัดลงไป
            required: true,
            minLength: 3, // เพื่อเอาไว้กำหนดว่าจะต้องมีความยาวต่ำสุดเท่าไหร่
        }
        const descriptionValidate: Validateable = { // สร้างตัวแปร descriptionValidate เพื่อเก็บค่า ต่อไปนี้
            value: enteredDescription, // จับตัวแปร enteredDescription ยัดลงไป
            required: true,
            minLength: 10, 
            max: 500, // เพื่อกำหนดจำนวนสูงสุด
        }
        const peopleValidate: Validateable = { // สร้างตัวแปรเพื่อเก็บค่า input ไปตรวจสอบ
            value: enteredPeople,
            required: true,
            min: 5,
            max: 10,
        }

        // เอาตัวแปรด้านบนมา call function validate ถ้าอันใดอันนึงผิด
        if (!validate(titleValidate) || !validate(descriptionValidate) || !validate(peopleValidate)) {
            alert('invalid input please try again!!') // ให้มันแสดงข้อความเตือน
            return;
        }else{
            return [enteredTitle, enteredDescription, +enteredPeople]; // แสดงค่าของตัวแปรที่ผ่าน
        }
    }

    private clearInput () { // สร้าง Function เอาไว้เคลียร์ input
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autobind
    private submitHandler (event: Event) {
        event.preventDefault();
        const userInput = this.getherUserInput();

        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            console.log(title,desc,people);
            this.clearInput();
        }
    }

    private config () {
        this.element.addEventListener('submit', this.submitHandler.bind(this));    
    }

    private attach () {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}

const prjInput = new ProjectInput();
const activeProjectsList = new ProjectList('active');
const finishedProjectsList = new ProjectList('finished');